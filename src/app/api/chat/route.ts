import { OpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import { Chat } from '@/models/chat';
import { Message as MessageModel } from '@/models/message';
import dbConnect from '@/lib/mongodb';
import { sendWebhook } from '@/lib/webhook';
import { getSharedUserMemory, saveChatMemory, ChatMessage, MessageRole } from '@/lib/chatMemory';
import mem0 from '@/lib/mem0';
import { v4 as uuidv4 } from 'uuid';
import { TransformStream } from 'stream/web';
import { TextEncoder } from 'util';

const GUEST_MESSAGE_LIMIT = 10;

// Initialize OpenAI clients with error handling
let openai: OpenAI;
let openrouter: OpenAI;

try {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set');
  } else {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  if (!process.env.OPENROUTER_API_KEY) {
    console.error('OPENROUTER_API_KEY is not set');
  } else {
    openrouter = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
    });
  }
} catch (error) {
  console.error('Failed to initialize OpenAI clients:', error);
  throw error;
}


// GET: fetch chats or messages
export async function POST(req: NextRequest) {
  console.log('Chat API request received');
  
  try {
    const authResult = await auth();
    const userId = authResult?.userId;
    const isGuest = !userId;
    
    console.log(`Processing request for ${isGuest ? 'guest' : 'user'}: ${userId || 'N/A'}`);

    await dbConnect();

    const body = await req.json();
    const { messages = [], chatId } = body;
    const userMessage = messages[messages.length - 1];
    const shouldStream =
      req.headers.get("accept")?.includes("text/event-stream") || body.stream === true;

    if (!userMessage?.content?.trim() && !userMessage?.fileUrl) {
      return NextResponse.json({ error: "No message content provided" }, { status: 400 });
    }

    // --- Guest handling ---
    let guestId = req.headers.get("x-guest-id");
    if (isGuest && !guestId) guestId = `guest-${uuidv4()}`;

    let remaining = GUEST_MESSAGE_LIMIT;
    if (isGuest && guestId) {
      const guestMessages = await MessageModel.countDocuments({
        userId: { $exists: false },
        guestId,
      });
      remaining = GUEST_MESSAGE_LIMIT - guestMessages;

      if (guestMessages >= GUEST_MESSAGE_LIMIT) {
        return NextResponse.json(
          {
            error: "GUEST_LIMIT_REACHED",
            message: `Free message limit (${GUEST_MESSAGE_LIMIT}) reached. Sign up to continue.`,
            remaining: 0,
          },
          { status: 429 }
        );
      }
    }

    // --- Build memory context (only for signed-in users) ---
    const contextMessages: Array<{ role: "user" | "assistant"; content: string }> = [];
    if (!isGuest && userMessage?.content) {
      try {
        const relevantMemories = await mem0.search(userMessage.content, {
          user_id: userId,
          limit: 5,
        });

        if (Array.isArray(relevantMemories)) {
          for (const memory of relevantMemories.slice(0, 3)) {
            if (memory.memory && typeof memory.memory === "string") {
              contextMessages.push({
                role: "assistant",
                content: `[Previous context: ${memory.memory}]`,
              });
            }
          }
        }
      } catch (err) {
        console.error("Error searching memories:", err);
      }
    }

    // --- Save current conversation to shared memory for signed-in users ---
    const currentMessages: ChatMessage[] = messages.map((m: Record<string, unknown>) => ({
      role: m.role as MessageRole,
      content: String(m.content),
      timestamp: new Date(),
    }));

    if (!isGuest) {
      await saveChatMemory({
        chatId: chatId || "new",
        userId,
        messages: currentMessages,
      });
    }

    // --- Format OpenAI messages ---
    const openAIMessages = [
      {
        role: "system",
        content:
          "You are a helpful AI assistant. Use any relevant context from previous conversations to provide better responses. Context is marked with [Previous context: ...].",
      },
      ...contextMessages,
      ...messages
        .filter(
          (m: Record<string, unknown>) =>
            ["system", "user", "assistant"].includes(String(m.role)) &&
            String(m.content)?.trim()
        )
        .map((m: Record<string, unknown>) => ({
          role: m.role,
          content: String(m.content),
        })),
    ];

    // Ensure at least one provider is available
    const hasOpenAI = Boolean(openai as unknown as OpenAI);
    const hasOpenRouter = Boolean(openrouter as unknown as OpenAI);
    if (!hasOpenAI && !hasOpenRouter) {
      return NextResponse.json(
        { error: 'LLM_NOT_CONFIGURED', message: 'No OpenAI or OpenRouter API key configured' },
        { status: 500 }
      );
    }

    // --- Streaming Mode ---
    if (shouldStream) {
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();
      const encoder = new TextEncoder();

      (async () => {
        let currentChatId = chatId;
        let assistantReply = "";

        try {
          // Create chat if new
          if (!currentChatId) {
            const newChat = await Chat.create({
              userId: isGuest ? undefined : userId,
              guestId: isGuest ? guestId : undefined,
              title:
                userMessage.content.substring(0, 30) +
                (userMessage.content.length > 30 ? "..." : ""),
              messages: [],
            });
            currentChatId = newChat._id.toString();

            await writer.write(
              encoder.encode(`data: ${JSON.stringify({ chatId: currentChatId })}\n\n`)
            );
          }

          // Save user message
          const userMsgDoc = await MessageModel.create({
            chatId: new mongoose.Types.ObjectId(currentChatId),
            userId: isGuest ? undefined : userId,
            guestId: isGuest ? guestId : undefined,
            role: "user",
            content: userMessage.content,
            timestamp: new Date(),
          });

          await Chat.findByIdAndUpdate(currentChatId, {
            $push: { messages: userMsgDoc._id },
            $set: { updatedAt: new Date() },
          });

          // Call OpenAI / OpenRouter (streaming)
          let aiStream;
          if (hasOpenAI) {
            try {
              aiStream = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: openAIMessages,
                stream: true,
                max_tokens: 1000,
                temperature: 0.7,
              });
            } catch (error) {
              if (!hasOpenRouter) throw error;
            }
          }
          if (!aiStream && hasOpenRouter) {
            aiStream = await openrouter.chat.completions.create({
              model: "openai/gpt-4o",
              messages: openAIMessages,
              stream: true,
              max_tokens: 1000,
              temperature: 0.7,
            });
          }

          for await (const chunk of aiStream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              assistantReply += content;
              await writer.write(
                encoder.encode(
                  `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`
                )
              );
            }
          }

          // Save assistant message
          if (assistantReply.trim()) {
            const assistantMsgDoc = await MessageModel.create({
              chatId: new mongoose.Types.ObjectId(currentChatId),
              userId: isGuest ? undefined : userId,
              guestId: isGuest ? guestId : undefined,
              role: "assistant",
              content: assistantReply,
              timestamp: new Date(),
            });

            await Chat.findByIdAndUpdate(currentChatId, {
              $push: { messages: assistantMsgDoc._id },
              $set: { updatedAt: new Date() },
            });

            if (!isGuest) {
              const updatedMessages = [
                ...currentMessages,
                { role: "assistant" as MessageRole, content: assistantReply, timestamp: new Date() },
              ];
              await saveChatMemory({ chatId: currentChatId, userId, messages: updatedMessages });
            }
          }

          await writer.write(encoder.encode("data: [DONE]\n\n"));
        } finally {
          await writer.close();
        }
      })();

      // Convert the stream to a web-compatible ReadableStream
      const webStream = new ReadableStream({
        start(controller) {
          const reader = stream.readable.getReader();
          function pump(): Promise<void> {
            return reader.read().then(({ done, value }) => {
              if (done) {
                controller.close();
                return;
              }
              controller.enqueue(value);
              return pump();
            });
          }
          return pump();
        },
      });

      return new Response(webStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // --- Non-streaming fallback ---
    let completion;
    if (hasOpenAI) {
      try {
        completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: openAIMessages,
          max_tokens: 1000,
          temperature: 0.7,
        });
      } catch (error) {
        if (!hasOpenRouter) throw error;
      }
    }
    if (!completion && hasOpenRouter) {
      completion = await openrouter.chat.completions.create({
        model: "openai/gpt-3.5-turbo",
        messages: openAIMessages,
        max_tokens: 1000,
        temperature: 0.7,
      });
    }

    const aiResponse = completion.choices[0]?.message?.content || "";

    // Save chat + assistant message
    let currentChatId = chatId;
    if (!currentChatId) {
      const newChat = await Chat.create({
        userId: isGuest ? undefined : userId,
        guestId: isGuest ? guestId : undefined,
        title:
          userMessage.content.substring(0, 30) +
          (userMessage.content.length > 30 ? "..." : ""),
        messages: [],
      });
      currentChatId = newChat._id.toString();
    }

    if (aiResponse.trim()) {
      await MessageModel.create({
        chatId: new mongoose.Types.ObjectId(currentChatId),
        userId: isGuest ? undefined : userId,
        guestId: isGuest ? guestId : undefined,
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      });

      await Chat.findByIdAndUpdate(currentChatId, {
        $set: { updatedAt: new Date() },
      });

      if (!isGuest) {
        const updatedMessages = [
          ...currentMessages,
          { role: "assistant" as MessageRole, content: aiResponse, timestamp: new Date() },
        ];
        await saveChatMemory({ chatId: currentChatId, userId, messages: updatedMessages });
      }
    }

    return NextResponse.json({
      response: aiResponse,
      chatId: currentChatId,
      remaining,
      guestId,
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      name: error?.name,
      code: error?.code,
      statusCode: error?.statusCode
    });
    
    return NextResponse.json(
      { 
        error: "Failed to process your request",
        details: process.env.NODE_ENV === 'development' ? errorMessage : 'An unexpected error occurred',
        requestId: req.headers.get('x-request-id') || 'unknown'
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');

    if (chatId) {
      // Fetch messages for a chat
      const messages = await MessageModel.find({
        chatId: new mongoose.Types.ObjectId(chatId),
        userId,
      })
        .sort({ timestamp: 1 })
        .lean();
      return NextResponse.json({ messages });
    }

    // Fetch all chats with last message
    const chats = await Chat.find({ userId })
      .sort({ updatedAt: -1 })
      .select('title _id updatedAt')
      .lean();

    const chatsWithLastMessage = await Promise.all(
      chats.map(async (chat) => {
        const lastMessage = await MessageModel.findOne(
          { chatId: chat._id },
          { content: 1, role: 1, timestamp: 1 },
          { sort: { timestamp: -1 } }
        ).lean();
        return { ...chat, lastMessage: lastMessage || null };
      })
    );

    return NextResponse.json(chatsWithLastMessage);
  } catch (err) {
    console.error('GET Chat API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}

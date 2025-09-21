import { OpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import mongoose from 'mongoose';
import { Chat } from '@/models/chat';
import { Message as MessageModel } from '@/models/message';
import dbConnect from '@/lib/mongodb';
import { sendWebhook } from '@/lib/webhook';
import mem0 from '@/lib/mem0';

// Initialize OpenAI clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  try {
    const body = await req.json();
    const { messages = [], chatId } = body;
    const userMessage = messages[messages.length - 1];
    const shouldStream =
      req.headers.get('accept')?.includes('text/event-stream') || body.stream === true;

    if (!userMessage?.content?.trim()) {
      return NextResponse.json({ error: 'No message content provided' }, { status: 400 });
    }

    await dbConnect();

    // Save messages to mem0
    const memoryMessages = messages
      .filter((m: any) => ['user', 'assistant'].includes(m.role))
      .map((m: any) => ({ role: m.role, content: String(m.content) }));
    await mem0.add(memoryMessages, { user_id: userId });

    // Format messages for OpenAI/OpenRouter
    const openAIMessages = [
      { role: 'system', content: 'You are a helpful AI assistant.' },
      ...messages
        .filter((m: any) => ['system', 'user', 'assistant'].includes(m.role) && m.content?.trim())
        .map((m: any) => ({ role: m.role, content: String(m.content) })),
    ];

    // If streaming requested
    if (shouldStream) {
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();
      const encoder = new TextEncoder();

      (async () => {
        let currentChatId = chatId;
        let assistantReply = '';

        try {
          // Create chat if not exist
          if (!currentChatId) {
            const newChat = await Chat.create({
              userId,
              title:
                userMessage.content.substring(0, 30) +
                (userMessage.content.length > 30 ? '...' : ''),
              messages: [],
            });
            currentChatId = newChat._id.toString();

            await sendWebhook('chat.created', {
              chatId: currentChatId,
              userId,
              title: newChat.title,
            });

            await writer.write(
              encoder.encode(`data: ${JSON.stringify({ chatId: currentChatId })}\n\n`)
            );
          }

          // Save user message
          const userMsgDoc = await MessageModel.create({
            chatId: new mongoose.Types.ObjectId(currentChatId),
            userId,
            role: 'user',
            content: userMessage.content,
            timestamp: new Date(),
          });

          await Chat.findByIdAndUpdate(currentChatId, {
            $push: { messages: userMsgDoc._id },
            $set: { updatedAt: new Date() },
          });

          // Try OpenAI first, fallback to OpenRouter if it fails
          let openaiStream;
          try {
            openaiStream = await openai.chat.completions.create({
              model: 'gpt-4o',
              messages: openAIMessages,
              stream: true,
              max_tokens: 1000,
              temperature: 0.7,
            });
          } catch (error) {
            console.log('OpenAI API failed, falling back to OpenRouter...');
            openaiStream = await openrouter.chat.completions.create({
              model: 'openai/gpt-4o',
              messages: openAIMessages,
              stream: true,
              max_tokens: 1000,
              temperature: 0.7,
            });
          }

          for await (const chunk of openaiStream) {
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
              userId,
              role: 'assistant',
              content: assistantReply,
              timestamp: new Date(),
            });

            await Chat.findByIdAndUpdate(currentChatId, {
              $push: { messages: assistantMsgDoc._id },
              $set: { updatedAt: new Date() },
            });
          }

          await writer.write(encoder.encode('data: [DONE]\n\n'));
        } catch (err) {
          console.error('Streaming error:', err);
          await writer.write(
            encoder.encode(`data: ${JSON.stringify({ error: 'Error generating response' })}\n\n`)
          );
        } finally {
          await writer.close();
        }
      })();

      return new Response(stream.readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Non-streaming fallback
    const response = await openrouter.chat.completions.create({
      model: 'openai/gpt-3.5-turbo',
      messages: openAIMessages,
      max_tokens: 1000,
      temperature: 0.7,
    });

    const aiResponse = response.choices[0]?.message?.content || '';

    // Save to DB
    let currentChatId = chatId;
    if (!currentChatId) {
      const newChat = await Chat.create({
        userId,
        title:
          userMessage.content.substring(0, 30) +
          (userMessage.content.length > 30 ? '...' : ''),
        messages: [],
      });
      currentChatId = newChat._id.toString();

      await sendWebhook('chat.created', {
        chatId: currentChatId,
        userId,
        title: newChat.title,
      });
    }

    // Save assistant message
    if (aiResponse.trim()) {
      const assistantMsgDoc = await MessageModel.create({
        chatId: new mongoose.Types.ObjectId(currentChatId),
        userId,
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      });

      await Chat.findByIdAndUpdate(currentChatId, {
        $push: { messages: assistantMsgDoc._id },
        $set: { updatedAt: new Date() },
      });
    }

    return NextResponse.json({ response: aiResponse, chatId: currentChatId });
  } catch (error: any) {
    console.error('Chat API error:', error);
    const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to generate response', details: errorMessage },
      { status: 500 }
    );
  }
}

// GET: fetch chats or messages
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

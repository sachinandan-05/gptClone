import { OpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectToDatabase from '@/lib/mongodb';
import { Chat } from '@/models/chat';
import { getChatMemory, saveChatMemory } from '@/lib/chatMemory';
import { v4 as uuidv4 } from 'uuid';

// Initialize OpenAI client with OpenRouter
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || '',
  baseURL: 'https://openrouter.ai/api/v1',
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const { messages, chatId } = await req.json();
    const userMessage = messages[messages.length - 1];
    
    // Connect to MongoDB
    await connectToDatabase();

    // Generate a new chat ID if not provided
    const chatIdToUse = chatId || `chat-${uuidv4()}`;
    
    // Get or create chat memory
    const existingMemory = await getChatMemory(chatIdToUse, userId);
    
    // Prepare memory update
    const memoryUpdate = {
      chatId: chatIdToUse,
      userId,
      messages: [...messages, {
        role: 'system' as const,
        content: `Current conversation with user ${userId}`,
        timestamp: new Date()
      }]
    };
    
    // Save the updated memory
    await saveChatMemory(memoryUpdate);
    
    // Get the memory context for the AI
    const memoryContext = existingMemory 
      ? `Previous conversation context: ${JSON.stringify(existingMemory.messages.slice(-5))}`
      : 'This is a new conversation.';

    let chat;
    
    if (chatId) {
      // Add message to existing chat
      chat = await Chat.findByIdAndUpdate(
        chatId,
        {
          $push: { 
            messages: {
              role: userMessage.role,
              content: userMessage.content
            }
          },
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!chat) {
        return new NextResponse('Chat not found', { status: 404 });
      }
    } else {
      // Create new chat
      chat = await Chat.create({
        userId,
        title: userMessage.content.substring(0, 30) + (userMessage.content.length > 30 ? '...' : ''),
        messages: messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        }))
      });
    }

    // Prepare messages with memory context
    const systemMessage = {
      role: 'system' as const,
      content: `You are a helpful AI assistant. ${memoryContext}`
    };

    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-3.5-turbo',
      messages: [systemMessage, ...messages],
    });
    
    // Save the AI's response to memory
    if (completion.choices[0]?.message) {
      const aiMessage = {
        role: 'assistant' as const,
        content: completion.choices[0].message.content || '',
        timestamp: new Date()
      };
      
      memoryUpdate.messages.push(aiMessage);
      await saveChatMemory(memoryUpdate);
    }

    const aiResponse = completion.choices[0].message;
    
    // Save AI response to the chat
    await Chat.findByIdAndUpdate(
      chat._id,
      {
        $push: { 
          messages: {
            role: 'assistant',
            content: aiResponse.content
          }
        },
        updatedAt: new Date()
      }
    );

    return NextResponse.json({ 
      content: aiResponse.content,
      chatId: chat._id 
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request.' },
      { status: 500 }
    );
  }
}

// Get user's chat history
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    await connectToDatabase();
    const chats = await Chat.find({ userId })
      .sort({ updatedAt: -1 })
      .select('title _id updatedAt');
    
    return NextResponse.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}

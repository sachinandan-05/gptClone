import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Message as MessageModel } from '@/models/message';
import { Chat } from '@/models/chat';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

// Get all messages for a chat
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return NextResponse.json(
        { error: 'Valid chatId is required' },
        { status: 400 }
      );
    }

    // Verify the chat belongs to the user
    console.log('Finding chat with ID:', chatId);
    const chat = await Chat.findOne({ _id: chatId, userId }).lean();
    console.log('Found chat:', chat);
    if (!chat) {
      console.error('Chat not found or access denied');
      return new NextResponse('Chat not found', { status: 404 });
    }

    console.log('Fetching messages for chat:', chatId);
    const [messages, total] = await Promise.all([
      MessageModel.find({ chatId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MessageModel.countDocuments({ chatId })
    ]);
    console.log(`Found ${messages.length} messages out of ${total} total`);

    return NextResponse.json({
      messages: messages.reverse(), // Return in chronological order
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// Create a new message
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    await dbConnect();
    
    const { chatId, role, content } = await req.json();
    
    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return NextResponse.json(
        { error: 'Valid chatId is required' },
        { status: 400 }
      );
    }

    if (!['user', 'assistant', 'system'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid message role' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Verify the chat belongs to the user
    const chat = await Chat.findOne({ _id: chatId, userId });
    if (!chat) {
      return new NextResponse('Chat not found', { status: 404 });
    }

    // Create the message
    const message = await MessageModel.create({
      chatId,
      role,
      content,
      timestamp: new Date()
    });

    // Update the chat's updatedAt timestamp
    await Chat.findByIdAndUpdate(chatId, { updatedAt: new Date() });

    return NextResponse.json(message);

  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}

// Delete all messages for a chat (for cleanup)
export async function DELETE(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    await dbConnect();
    
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');

    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return NextResponse.json(
        { error: 'Valid chatId is required' },
        { status: 400 }
      );
    }

    // Verify the chat belongs to the user
    const chat = await Chat.findOne({ _id: chatId, userId });
    if (!chat) {
      return new NextResponse('Chat not found', { status: 404 });
    }

    // Delete all messages for this chat
    await MessageModel.deleteMany({ chatId });

    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error('Error deleting messages:', error);
    return NextResponse.json(
      { error: 'Failed to delete messages' },
      { status: 500 }
    );
  }
}

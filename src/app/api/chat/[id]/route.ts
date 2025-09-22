import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Message as MessageModel } from '@/models/message';
import Chat from '@/models/chat';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

type RouteContext = {
  params: { id: string } | Promise<{ id: string }>;
};

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const params = await Promise.resolve(context.params);
  const chatId = params.id;
  if (!chatId) {
    return new NextResponse('Chat ID is required', { status: 400 });
  }

  try {
    await dbConnect();
    
    // Get all messages for the specified chat
    const messages = await MessageModel.find({ 
      chatId: new mongoose.Types.ObjectId(chatId),
      userId 
    })
    .sort({ timestamp: 1 })
    .lean();

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const params = await Promise.resolve(context.params);
  const chatId = params.id;
  if (!chatId) {
    return new NextResponse('Chat ID is required', { status: 400 });
  }

  try {
    await dbConnect();
    
    // Delete all messages in the chat
    await MessageModel.deleteMany({ 
      chatId: new mongoose.Types.ObjectId(chatId),
      userId 
    });

    // Delete the chat
    await Chat.deleteOne({ _id: new mongoose.Types.ObjectId(chatId), userId });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<Response> {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const params = await Promise.resolve(context.params);
  const chatId = params.id;
  if (!chatId) {
    return new NextResponse('Chat ID is required', { status: 400 });
  }

  const { title } = await request.json();
  if (!title?.trim()) {
    return new NextResponse('Title is required', { status: 400 });
  }

  try {
    await dbConnect();
    
    // Update the chat title
    const updatedChat = await Chat.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(chatId), userId },
      { title: title.trim() },
      { new: true }
    );

    if (!updatedChat) {
      return new NextResponse('Chat not found', { status: 404 });
    }

    return NextResponse.json(updatedChat);
  } catch (error) {
    console.error('Error updating chat:', error);
    return NextResponse.json(
      { error: 'Failed to update chat' },
      { status: 500 }
    );
  }
}

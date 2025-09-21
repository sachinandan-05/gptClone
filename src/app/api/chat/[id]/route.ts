import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Message as MessageModel } from '@/models/message';
import dbConnect from '@/lib/mongodb';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

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

// Add this to fix TypeScript error
import mongoose from 'mongoose';

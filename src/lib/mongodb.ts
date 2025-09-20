import mongoose, { ConnectOptions } from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose as { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: ConnectOptions = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('Connected to MongoDB');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatDocument {
  _id: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatModel extends mongoose.Model<ChatDocument> {
  // Add any static methods here if needed
}

const chatSchema = new mongoose.Schema<ChatDocument, ChatModel>(
  {
    messages: [
      {
        role: { type: String, required: true, enum: ['user', 'assistant', 'system'] },
        content: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

const Chat: ChatModel = mongoose.models.Chat || mongoose.model<ChatDocument, ChatModel>('Chat', chatSchema);

export async function getChatById(id: string): Promise<ChatDocument | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  try {
    await dbConnect();
    const chat = await Chat.findById(id).lean().exec();
    
    if (!chat) return null;
    
    // Convert _id to string and ensure proper typing
    return {
      _id: chat._id.toString(),
      messages: chat.messages,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt
    } as ChatDocument;
  } catch (error) {
    console.error('Error fetching chat:', error);
    return null;
  }
}

export default dbConnect;
import mongoose, { ConnectOptions } from 'mongoose';
import { Message, IMessage } from '@/models/message';

const MONGODB_URI = process.env.MONGODB_URI;

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

async function dbConnect(retries = 3, delay = 1000): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 100, // Increased from default
      minPoolSize: 5,
      maxConnecting: 10,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
      retryWrites: true,
      retryReads: true,
      dbName: 'gpt-clone',
    } as ConnectOptions;

    const connectWithRetry = async (attempt = 1): Promise<typeof mongoose> => {
      try {
        if (!MONGODB_URI) {
          throw new Error('MONGODB_URI is not defined');
        }
        const connection = await mongoose.connect(MONGODB_URI, opts);
        console.log('MongoDB connected successfully');
        return connection;
      } catch (error) {
        if (attempt >= retries) {
          console.error('Failed to connect to MongoDB after retries:', error);
          throw error;
        }
        console.log(`MongoDB connection attempt ${attempt} failed. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return connectWithRetry(attempt + 1);
      }
    };

    cached.promise = connectWithRetry();
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

export interface ChatDocument extends mongoose.Document {
  _id: string;
  userId?: string;
  guestId?: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatModel extends mongoose.Model<ChatDocument> {
  // Add any static methods here if needed
}

// Add retry logic for transactions
export const withTransaction = async (fn: (session: mongoose.ClientSession) => Promise<any>) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
};

const chatSchema = new mongoose.Schema<ChatDocument, ChatModel>(
  {
    userId: { 
      type: String, 
      required: false, 
      index: true 
    },
    guestId: {
      type: String,
      required: false,
      index: true
    },
    title: { 
      type: String, 
      required: true 
    },
    messages: [
      {
        role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
        content: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

const Chat: ChatModel = mongoose.models.Chat || mongoose.model<ChatDocument, ChatModel>('Chat', chatSchema);

export async function getChatById(id: string): Promise<ChatDocument | null> {
  try {
    await dbConnect();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error('Invalid chat ID format:', id);
      return null;
    }
    
    const chat = await Chat.findById(id)
      .populate({
        path: 'messages',
        options: { sort: { timestamp: 1 } }
      })
      .lean();
    
    if (!chat) {
      console.log('Chat not found with ID:', id);
      return null;
    }
    
    return {
      _id: chat._id.toString(),
      userId: chat.userId,
      title: chat.title,
      messages: chat.messages || [],
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt
    } as ChatDocument;
  } catch (error) {
    console.error('Error in getChatById:', error);
    throw error;
  }
}

export async function getMessagesByChatId(chatId: string, userId?: string, guestId?: string): Promise<IMessage[]> {
  try {
    await dbConnect();
    
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      console.error('Invalid chat ID format:', chatId);
      return [];
    }
    
    const query: any = { 
      chatId: new mongoose.Types.ObjectId(chatId)
    };
    
    // If we have a userId, use that, otherwise use guestId
    if (userId) {
      query.userId = userId;
    } else if (guestId) {
      query.guestId = guestId;
    } else {
      console.error('Either userId or guestId must be provided');
      return [];
    }
    
    console.log(`Fetching messages for chat ${chatId}${userId ? ` and user ${userId}` : ` and guest ${guestId}`}`);
    
    const messages = await Message.find(query)
      .sort({ timestamp: 1 })
      .lean()
      .exec() as unknown as IMessage[];
    
    if (!messages || messages.length === 0) {
      console.log('No messages found for query:', query);
      return [];
    }
    
    // Ensure we have valid messages
    const validMessages = messages.filter((msg: any) => 
      msg?.content && 
      msg?.role && 
      ['user', 'assistant', 'system'].includes(String(msg.role).toLowerCase())
    ) as IMessage[];
    
    console.log(`Found ${validMessages.length} valid messages out of ${messages.length} total`);
    
    return validMessages.map((msg: any) => ({
      ...msg,
      _id: msg._id?.toString() || new mongoose.Types.ObjectId().toString(),
      chatId: msg.chatId?.toString() || '',
      userId: msg.userId || '',
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content || '',
      timestamp: msg.timestamp || new Date()
    }));
    
  } catch (error) {
    console.error('Error in getMessagesByChatId:', error);
    // Don't throw to prevent breaking the UI, just log and return empty array
    return [];
  }
}

export default dbConnect;
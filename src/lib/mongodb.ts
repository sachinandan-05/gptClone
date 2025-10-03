import mongoose, { ConnectOptions } from 'mongoose';
import { Message, IMessage } from '@/models/message';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Type for the mongoose cache
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Augment the global type to include our mongoose cache
declare global {
  var mongooseGlobal: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

// Initialize the cache
const MONGODB_CACHE = global.mongooseGlobal || { conn: null, promise: null };

async function dbConnect(retries = 3, delay = 1000): Promise<typeof mongoose> {
  // Initialize global cache if it doesn't exist
  if (!global.mongooseGlobal) {
    global.mongooseGlobal = { conn: null, promise: null };
  }
  if (MONGODB_CACHE.conn) {
    return MONGODB_CACHE.conn;
  }

  if (!MONGODB_CACHE.promise) {
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
        MONGODB_CACHE.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
          return mongooseInstance;
        });
        console.log('MongoDB connected successfully');
        return MONGODB_CACHE.promise as Promise<typeof mongoose>;
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

    MONGODB_CACHE.promise = connectWithRetry();
  }

  try {
    MONGODB_CACHE.conn = await MONGODB_CACHE.promise;
    if (!MONGODB_CACHE.conn) {
      throw new Error('Failed to establish MongoDB connection');
    }
    return MONGODB_CACHE.conn;
  } catch (e) {
    MONGODB_CACHE.promise = null;
    throw e;
  }
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

// Define ChatModel with proper type parameters
interface ChatModel extends mongoose.Model<ChatDocument> {
  // Add any static methods here if needed
  findByIdAndUpdateWithRetry: (id: string, update: Record<string, unknown>, options?: mongoose.QueryOptions) => Promise<ChatDocument | null>;
}

// Add retry logic for transactions
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const withTransaction = async <T>(
  fn: (session: mongoose.ClientSession) => Promise<T>,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  maxRetries = 3
): Promise<T> => {
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

// Define the chat schema
type ChatDocumentType = ChatDocument & mongoose.Document;

const chatSchema = new mongoose.Schema<ChatDocumentType, ChatModel>(
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

// Define the transform function with proper typing
chatSchema.set('toJSON', {
  transform: function(doc, ret) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, __v, ...rest } = ret;
    
    // Return a new object with the transformed properties
    return {
      ...rest,
      id: _id.toString()
    };
  }
});

// Add the implementation for findByIdAndUpdateWithRetry
chatSchema.static('findByIdAndUpdateWithRetry', async function(
  this: ChatModel,
  id: string, 
  update: Record<string, unknown>, 
  options: mongoose.QueryOptions = {}
): Promise<ChatDocument | null> {
  const maxRetries = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await this.findByIdAndUpdate(id, update, {
        ...options,
        new: true,
        runValidators: true
      });
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
      }
    }
  }
  
  console.error(`Failed to update chat ${id} after ${maxRetries} attempts`, lastError);
  return null;
});

// Add the static method to the schema
chatSchema.static('findByIdAndUpdateWithRetry', async function(
  this: ChatModel,
  id: string, 
  update: Record<string, unknown>, 
  options: mongoose.QueryOptions = {}
): Promise<ChatDocument | null> {
  const maxRetries = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await this.findByIdAndUpdate(id, update, {
        ...options,
        new: true,
        runValidators: true
      });
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
      }
    }
  }
  
  console.error(`Failed to update chat ${id} after ${maxRetries} attempts`, lastError);
  return null;
});

// Create or retrieve the model with proper typing
let Chat: ChatModel;

if (mongoose.models.Chat) {
  // Cast the existing model to ChatModel
  Chat = mongoose.models.Chat as unknown as ChatModel;
} else {
  // Create a new model with the schema
  Chat = mongoose.model<ChatDocument, ChatModel>('Chat', chatSchema);
}

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
    
    // Define a type for the query object
    interface MessageQuery {
      chatId: mongoose.Types.ObjectId;
      userId?: string;
      guestId?: string;
    }
    
    const query: MessageQuery = { 
      chatId: new mongoose.Types.ObjectId(chatId)
    };
    
    // If we have a userId, use that, otherwise use guestId
    if (userId) {
      query.userId = userId;
    } else if (guestId) {
      query.guestId = guestId;
    } else {
      console.error('Either userId or guestId must be provided for chat:', chatId);
      console.error('Provided parameters:', { userId, guestId });
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
    const validMessages = messages.filter((msg: IMessage) => 
      msg?.content && 
      msg?.role && 
      ['user', 'assistant', 'system'].includes(String(msg.role).toLowerCase())
    );
    
    console.log(`Found ${validMessages.length} valid messages out of ${messages.length} total`);
    
    // Define a type for the plain message object
    type PlainMessage = Omit<IMessage, keyof Document> & {
      _id: mongoose.Types.ObjectId;
      chatId: mongoose.Types.ObjectId;
      timestamp: Date;
    };

    return validMessages.map((msg) => {
      // Convert to plain object and handle potential Mongoose document methods
      const msgObj = msg.toObject ? msg.toObject() : msg as unknown as PlainMessage;
      
      // Return a new object that matches the IMessage interface
      return {
        _id: msgObj._id,
        chatId: msgObj.chatId,
        userId: msgObj.userId || '',
        role: msgObj.role,
        content: msgObj.content || '',
        timestamp: msgObj.timestamp || new Date(),
        ...(msgObj.guestId && { guestId: msgObj.guestId }),
        ...(msgObj.fileUrl && { fileUrl: msgObj.fileUrl }),
        ...(msgObj.fileType && { fileType: msgObj.fileType })
      } as IMessage;
    });
    
  } catch (error) {
    console.error('Error in getMessagesByChatId:', error);
    // Don't throw to prevent breaking the UI, just log and return empty array
    return [];
  }
}

export default dbConnect;
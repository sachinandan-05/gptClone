import mongoose, { Schema, Document, Model } from "mongoose";
import { IMessage } from "./message";

export interface IChat extends Document {
  _id: mongoose.Types.ObjectId;
  userId?: string; // Optional for guest users
  guestId?: string; // For guest users
  title: string;
  messages: IMessage[];
  role?: string;
  content?: string;
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<IChat>(
  {
    userId: { 
      type: String, 
      required: false, // Made optional for guest users
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
    messages: [{ 
      type: Schema.Types.ObjectId, 
      ref: 'Message' 
    }],
    role: { 
      type: String, 
      enum: ['user', 'assistant', 'system'],
      default: 'assistant' 
    },
    content: { 
      type: String, 
      default: '' 
    },
  },
  {
    timestamps: true,
    toJSON: { 
      virtuals: true, 
      getters: true,
      transform: function(doc: mongoose.Document, ret: Record<string, unknown>) {
        const transformed: Record<string, unknown> = { ...ret };
        
        // Convert _id to id and remove _id
        if (transformed._id && typeof transformed._id === 'object' && '_id' in transformed) {
          transformed.id = transformed._id.toString();
          delete transformed._id;
        }
        
        // Remove __v
        if ('__v' in transformed) {
          delete transformed.__v;
        }
        
        return transformed;
      }
    },
    toObject: { 
      virtuals: true, 
      getters: true 
    },
  }
);

// Add indexes for better query performance
chatSchema.index({ userId: 1, updatedAt: -1 }, { sparse: true });
chatSchema.index({ guestId: 1, updatedAt: -1 }, { sparse: true });
chatSchema.index({ 'messages': 1 });

// Add compound index to ensure either userId or guestId is present
chatSchema.index(
  { userId: 1, guestId: 1 },
  {
    partialFilterExpression: {
      $or: [
        { userId: { $exists: true } },
        { guestId: { $exists: true } }
      ]
    }
  }
);

export const Chat: Model<IChat> =
  mongoose.models.Chat || mongoose.model<IChat>("Chat", chatSchema);

export default Chat;

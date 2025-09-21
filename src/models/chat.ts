import mongoose, { Schema, Document, Model } from "mongoose";
import { IMessage } from "./message";

export interface IChat extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string; // or ObjectId if you have a User model
  title: string;
  messages: IMessage[];
  role?: string;  // Optional as it might be a default value
  content?: string;  // Optional as it might be a default value
  createdAt: Date;
  updatedAt: Date;
}

const chatSchema = new Schema<IChat>(
  {
    userId: { 
      type: String, 
      required: true, 
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
      transform: function(doc: any, ret: any) {
        ret.id = ret._id;
        if ('_id' in ret) delete ret._id;
        if ('__v' in ret) delete ret.__v;
        return ret;
      }
    },
    toObject: { 
      virtuals: true, 
      getters: true 
    },
  }
);

// Add indexes for better query performance
chatSchema.index({ userId: 1, updatedAt: -1 });
chatSchema.index({ 'messages': 1 });

export const Chat: Model<IChat> =
  mongoose.models.Chat || mongoose.model<IChat>("Chat", chatSchema);

export default Chat;

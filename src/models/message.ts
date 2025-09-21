import mongoose, { Schema, Document, Model } from "mongoose";
import { IChat } from "./chat";

export interface IMessage extends Document {
    chatId: mongoose.Types.ObjectId;
    userId?: string;
    guestId?: string;
    role: "user" | "assistant" | "system";
    content: string;
    fileUrl?: string;
    fileType?: 'image' | 'document' | 'video' | 'audio' | 'other';
    timestamp: Date;
}
  
const messageSchema = new Schema<IMessage>(
  {
    chatId: { 
      type: Schema.Types.ObjectId, 
      ref: "Chat", 
      required: true, 
      index: true 
    },
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
    role: { 
      type: String, 
      enum: ["user", "assistant", "system"], 
      required: true 
    },
    content: { 
      type: String, 
      required: [true, 'Message content is required'],
      trim: true
    },
    fileUrl: {
      type: String,
      default: null
    },
    fileType: {
      type: String,
      enum: ['image', 'document', 'video', 'audio', 'other'],
      default: null
    },
    timestamp: { 
      type: Date, 
      default: Date.now,
      index: true 
    },
  },
  {
    timestamps: true,
    toJSON: { 
      virtuals: true,
      transform: function(doc: any, ret: any) {
        ret.id = ret._id;
        if ('_id' in ret) delete ret._id;
        if ('__v' in ret) delete ret.__v;
        return ret;
      }
    },
    toObject: { 
      virtuals: true 
    }
  }
);

// Add indexes for better query performance
messageSchema.index({ chatId: 1, timestamp: 1 });
messageSchema.index({ userId: 1, timestamp: -1 });
  
export const Message: Model<IMessage> =
    mongoose.models.Message || mongoose.model<IMessage>("Message", messageSchema);
  
export default Message;
  
import mongoose, { Schema, Document, Model } from "mongoose";

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
      transform: function(doc: Document, ret: Record<string, unknown>) {
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
  
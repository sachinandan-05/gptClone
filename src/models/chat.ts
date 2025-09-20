// src/models/chat.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage {
  _id?: mongoose.Types.ObjectId;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface IChat extends Document {
  userId: string;
  title: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const chatSchema = new Schema<IChat>({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  messages: [messageSchema]
}, { timestamps: true });

export const Chat = mongoose.models.Chat || mongoose.model<IChat>('Chat', chatSchema);
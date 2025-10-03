// Shared types for chat functionality

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  fileUrl?: string;
  fileType?: 'image' | 'document' | 'video' | 'audio' | 'other';
}
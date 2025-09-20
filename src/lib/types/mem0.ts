export interface MemoryMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface MemoryMetadata {
  chatId: string;
  type: string;
  memoryKey: string;
  [key: string]: any;
}

export interface MemoryOptions {
  userId: string;
  metadata?: MemoryMetadata | string;
  [key: string]: any;
}

export interface MemoryItem {
  id: string;
  userId: string;
  content: MemoryMessage[];
  metadata?: MemoryMetadata | string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface MemorySearchOptions {
  userId: string;
  limit?: number;
  metadata?: Record<string, any>;
}

export interface MemoryResult {
  id: string;
  userId: string;
  content: MemoryMessage[];
  metadata?: MemoryMetadata | string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MemoryUpdateOptions extends MemoryOptions {
  id: string;
}

export interface MemoryAddOptions extends MemoryOptions {}

export interface MemoryGetOptions {
  userId: string;
  id?: string;
  limit?: number;
}

export interface MemoryDeleteOptions {
  userId: string;
  id: string;
}

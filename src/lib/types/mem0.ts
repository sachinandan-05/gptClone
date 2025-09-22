export interface MemoryMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export type MetadataValue = string | number | boolean | null | undefined | MetadataValue[] | { [key: string]: MetadataValue };

export interface MemoryMetadata {
  chatId: string;
  type: string;
  memoryKey: string;
  [key: string]: MetadataValue;
}

export interface MemoryOptions {
  userId: string;
  metadata?: MemoryMetadata | string;
  [key: string]: unknown;
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
  metadata?: Record<string, unknown>;
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

export type MemoryAddOptions = MemoryOptions;

export interface MemoryGetOptions {
  userId: string;
  id?: string;
  limit?: number;
}

export interface MemoryDeleteOptions {
  userId: string;
  id: string;
}

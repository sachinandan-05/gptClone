import mem0 from './mem0';
import type { MemoryItem, MemoryMessage, MemoryResult } from './types/mem0';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export interface ChatMemory {
  chatId: string;
  userId: string;
  messages: ChatMessage[];
}

// Helper to serialize/deserialize dates
const serializeMemory = (memory: ChatMemory): string => {
  return JSON.stringify(memory, (key, value) => 
    value instanceof Date ? value.toISOString() : value
  );
};

const deserializeMemory = (data: string): ChatMemory => {
  return JSON.parse(data, (key, value) => {
    if (key === 'timestamp' && typeof value === 'string') {
      return new Date(value);
    }
    return value;
  });
};

// Filter out system messages and ensure valid message format for mem0
const filterSystemMessages = (messages: ChatMessage[]): Array<{ role: 'user' | 'assistant'; content: string }> => {
  return messages
    .filter(msg => msg.role !== 'system')
    .map(({ role, content }) => ({
      role: role as 'user' | 'assistant',
      content
    }));
};

export async function saveChatMemory(chatMemory: ChatMemory): Promise<boolean> {
  try {
    const memoryKey = `chat:${chatMemory.chatId}:${chatMemory.userId}`;
    
    // First, check if we already have a memory for this chat
    const existing = await getChatMemory(chatMemory.chatId, chatMemory.userId);

    // Prepare options for mem0
    const options = {
      userId: chatMemory.userId,
      metadata: {
        chatId: chatMemory.chatId,
        type: 'chat_memory',
        memoryKey
      }
    };

    // Filter out system messages and prepare for mem0
    const messagesForMem0 = filterSystemMessages(chatMemory.messages);
    const memoryContent = JSON.stringify(messagesForMem0);

    if (existing) {
      // Update existing memory
      await mem0.update(memoryKey, {
        text: memoryContent,
        metadata: options.metadata
      });
    } else {
      // Create new memory with the serialized content
      // @ts-ignore - The mem0.add type expects an array, but we're sending a string
      await mem0.add(memoryContent, options);
    }
    
    return true;
  } catch (error) {
    console.error('Error saving chat memory:', error);
    return false;
  }
}

export async function getChatMemory(chatId: string, userId: string): Promise<ChatMemory | null> {
  try {
    const memoryKey = `chat:${chatId}:${userId}`;
    
    // Get all memories for this user
    const allMemories = await mem0.getAll({
      user_id : userId,
      limit: 100 // Adjust limit as needed
    }) as unknown as MemoryResult[];
    
    if (!Array.isArray(allMemories)) return null;
    
    // Find the memory for this chat
    for (const memory of allMemories) {
      try {
        if (!memory.metadata) continue;
        
        // Handle both string and object metadata
        const meta = typeof memory.metadata === 'string' 
          ? JSON.parse(memory.metadata) 
          : memory.metadata;
          
        if (meta.chatId === chatId && meta.type === 'chat_memory') {
          // The memory content is in the second system message
          const memoryContent = memory.content?.find(
            (msg: MemoryMessage) => msg.role === 'system' && msg.content.startsWith('{')
          );
          
          return memoryContent ? deserializeMemory(memoryContent.content) : null;
        }
      } catch (e) {
        console.error('Error parsing memory metadata:', e);
        continue;
      }
    }
    
    return null;
          } catch (error) {
    console.error('Error retrieving chat memory:', error);
    return null;
  }
}

export async function updateChatMemory(
  chatId: string,
  userId: string,
  updateFn: (current: ChatMemory | null) => ChatMemory
): Promise<boolean> {
  try {
    const current = await getChatMemory(chatId, userId);
    const updated = updateFn(current);
    return await saveChatMemory(updated);
  } catch (error) {
    console.error('Error updating chat memory:', error);
    return false;
  }
}

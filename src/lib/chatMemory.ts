import mem0 from './mem0';
import type { MemoryResult } from './types/mem0';

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
  return JSON.stringify(memory, (_, value) => 
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
    if (!process.env.MEM0_API_KEY) {
      console.warn('MEM0_API_KEY not configured, skipping memory save');
      return false;
    }

    // Filter out system messages and prepare for mem0
    const messagesForMem0 = filterSystemMessages(chatMemory.messages);

    if (messagesForMem0.length === 0) {
      console.warn('No valid messages to save to memory');
      return false;
    }

    console.log(`[Memory] Saving ${messagesForMem0.length} messages for user: ${chatMemory.userId}`);

    // Always save new messages directly - this creates a memory entry
    const result = await mem0.add(messagesForMem0, {
      user_id: chatMemory.userId,
      metadata: {
        type: 'shared_user_memory',
        chatId: chatMemory.chatId,
        timestamp: new Date().toISOString()
      }
    });
    
    console.log('[Memory] Successfully saved to mem0:', result);
    return true;
  } catch (error) {
    console.error('[Memory] Error saving chat memory:', error);
    if (error instanceof Error) {
      console.error('[Memory] Error details:', error.message, error.stack);
    }
    return false;
  }
}

export async function getSharedUserMemory(userId: string): Promise<ChatMemory | null> {
  try {
    if (!process.env.MEM0_API_KEY) {
      console.warn('MEM0_API_KEY not configured, skipping memory retrieval');
      return null;
    }

    console.log(`[Memory] Retrieving memories for user: ${userId}`);

    // Get all memories for this user
    const allMemories = await mem0.getAll({
      user_id: userId,
      limit: 100 // Adjust limit as needed
    }) as unknown as MemoryResult[];
    
    console.log(`[Memory] Retrieved ${allMemories?.length || 0} memory entries`);
    
    if (!Array.isArray(allMemories) || allMemories.length === 0) {
      console.log('[Memory] No memories found for user');
      return null;
    }
    
    // Collect all messages from shared memories
    const allMessages: ChatMessage[] = [];
    
    for (const memory of allMemories) {
      try {
        if (!memory.metadata) continue;
        
        // Handle both string and object metadata
        const meta = typeof memory.metadata === 'string' 
          ? JSON.parse(memory.metadata) 
          : memory.metadata;
          
        if (meta.type === 'shared_user_memory') {
          // Extract messages from the memory content
          if (memory.content && Array.isArray(memory.content)) {
            for (const msg of memory.content) {
              if (msg.role === 'user' || msg.role === 'assistant') {
                allMessages.push({
                  role: msg.role as 'user' | 'assistant',
                  content: msg.content,
                  timestamp: new Date(meta.timestamp || Date.now())
                });
              }
            }
          }
        }
      } catch (e) {
        console.error('Error parsing memory metadata:', e);
        continue;
      }
    }
    
    if (allMessages.length === 0) return null;
    
    // Sort messages by timestamp and return most recent ones
    const sortedMessages = allMessages
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .slice(-50); // Keep last 50 messages
    
    return {
      chatId: 'shared',
      userId,
      messages: sortedMessages
    };
    
  } catch (error) {
    console.error('Error retrieving shared user memory:', error);
    return null;
  }
}

export async function getChatMemory(chatId: string, userId: string): Promise<ChatMemory | null> {
  // Now getChatMemory returns the shared user memory instead of chat-specific memory
  return await getSharedUserMemory(userId);
}

export async function updateChatMemory(
  chatId: string,
  userId: string,
  updateFn: (current: ChatMemory | null) => ChatMemory
): Promise<boolean> {
  try {
    const current = await getSharedUserMemory(userId);
    const updated = updateFn(current);
    // Update the chatId to the current one being used
    updated.chatId = chatId;
    return await saveChatMemory(updated);
  } catch (error) {
    console.error('Error updating chat memory:', error);
    return false;
  }
}

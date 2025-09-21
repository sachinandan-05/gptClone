import { NextResponse } from 'next/server';
import mem0 from '@/lib/mem0';

export async function GET() {
  try {
    // Test basic mem0 functionality
    const testMessages = [
      { role: 'user' as const, content: 'Test message to mem0' }
    ];
    
    // 1. Add a test memory
    const addResult = await mem0.add(testMessages, { 
      user_id: 'test-user'
    });
    
    // 2. Search for the test memory
    const searchResults = await mem0.search('test', {
      user_id: 'test-user'
    });
    
    return NextResponse.json({
      success: true,
      addResult,
      searchResults
    });
    
  } catch (error) {
    console.error('mem0 test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

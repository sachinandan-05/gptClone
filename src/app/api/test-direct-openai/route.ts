import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// Initialize OpenAI client with direct API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  try {
    // Test the direct OpenAI API with a simple completion
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Say this is a direct API test',
        },
      ],
      max_tokens: 10,
    });

    return NextResponse.json({
      success: true,
      message: 'Direct OpenAI API is working!',
      response: response.choices[0]?.message?.content || 'No content',
    });
  } catch (error: unknown) {
    console.error('Direct OpenAI API test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to connect to direct OpenAI API',
        details: error instanceof Error ? error.message : 'Unknown error',
        code: error && typeof error === 'object' && 'code' in error ? String(error.code) : 'UNKNOWN_ERROR',
      },
      { status: 500 }
    );
  }
}

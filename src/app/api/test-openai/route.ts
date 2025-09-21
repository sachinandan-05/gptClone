import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

export async function GET() {
  try {
    // Test the API with a simple completion
    const response = await openai.chat.completions.create({
      model: 'openai/gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Say this is a test',
        },
      ],
      max_tokens: 10,
    });

    return NextResponse.json({
      success: true,
      message: 'OpenAI API is working!',
      response: response.choices[0]?.message?.content || 'No content',
    });
  } catch (error: any) {
    console.error('OpenAI API test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to connect to OpenAI API',
        details: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}

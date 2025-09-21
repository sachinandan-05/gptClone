import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

// Initialize OpenRouter client
const openrouter = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const stream = url.searchParams.get('stream') === 'true';

  try {
    if (stream) {
      // Create a streaming response
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();
      const encoder = new TextEncoder();

      // Start streaming in the background
      (async () => {
        try {
          const stream = await openrouter.chat.completions.create({
            model: 'openai/gpt-4o',
            messages: [
              {
                role: 'user',
                content: 'Say this is a streaming test of GPT-4o. Count from 1 to 5 with a brief pause between each number.',
              },
            ],
            max_tokens: 100,
            stream: true,
            temperature: 0.7,
          });

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              await writer.write(
                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
              );
            }
          }

          await writer.write(encoder.encode('data: [DONE]\n\n'));
          await writer.close();
        } catch (error) {
          console.error('Streaming error:', error);
          await writer.abort(error);
        }
      })();

      return new Response(stream.readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Non-streaming response
      const response = await openrouter.chat.completions.create({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'user',
            content: 'Say this is a test of GPT-4o',
          },
        ],
        max_tokens: 20,
      });

      return NextResponse.json({
        success: true,
        message: 'OpenRouter API is working!',
        response: response.choices[0]?.message?.content || 'No content',
        model: response.model,
      });
    }
  } catch (error: any) {
    console.error('OpenRouter API test error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to connect to OpenRouter API',
        details: error.message,
        code: error.code,
      },
      { status: 500 }
    );
  }
}

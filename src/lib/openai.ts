import { OpenAI } from 'openai';

// Create OpenAI client configured for OpenRouter
export const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'http://localhost:3000', // Your site URL
    'X-Title': 'ChatGPT ', // Your site name
  },
  dangerouslyAllowBrowser: true, // Only if you're using it in the browser
});

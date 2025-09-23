import OpenAI from 'openai';

// Create standard OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Using standard OpenAI API key
  dangerouslyAllowBrowser: true // Only if you're using it in the browser
});

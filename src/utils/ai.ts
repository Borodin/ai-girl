import OpenAI from 'openai';

if (!process.env.DEEPSEEK_API_KEY) {
  throw new Error('DEEPSEEK_API_KEY is required');
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  answer: string;
  sympathy: number;
  reply_suggestions: string[];
  photo_prompt?: string;
}

const aiClient = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

export async function generateResponse(messages: AIMessage[]): Promise<AIResponse> {
  const completion = await aiClient.chat.completions.create({
    model: 'deepseek-chat',
    messages,
    temperature: 0.8,
    max_tokens: 2000,
    response_format: {
      type: 'json_object',
    },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No content in AI response');
  }
  return JSON.parse(content) as AIResponse;
}

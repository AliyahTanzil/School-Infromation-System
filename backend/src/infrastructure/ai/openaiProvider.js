import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

const fallback = {
  text: 'AI provider is not configured. Showing a safe advisory fallback based on current school signals.',
  source: 'deterministic-fallback',
};

export async function generateAdvisory({ prompt, system }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallback;
  const provider = createOpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });
  try {
    const result = await generateText({
      model: provider(process.env.OPENAI_MODEL || 'gpt-4o-mini'),
      system: `${system}\nDo not claim certainty. Do not mutate records. Cite the supplied evidence.`,
      prompt,
      maxOutputTokens: 700,
      abortSignal: AbortSignal.timeout(12000),
    });
    return { text: result.text, source: 'openai-compatible', usage: result.usage };
  } catch {
    return fallback;
  }
}

export function isProviderConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

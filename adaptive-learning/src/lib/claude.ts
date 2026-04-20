import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join } from 'path';

let cachedApiKey: string | null = null;

function getAnthropicApiKey(): string {
  if (cachedApiKey) return cachedApiKey;

  // On Vercel, process.env works correctly — check it first with a real value
  const envKey = process.env.ANTHROPIC_API_KEY;
  if (envKey && envKey.startsWith('sk-')) {
    cachedApiKey = envKey;
    return cachedApiKey;
  }

  // Locally, process.env might have an empty ANTHROPIC_API_KEY from the system
  // so we read directly from .env.local to get the real value
  try {
    const envPath = join(process.cwd(), '.env.local');
    const envContent = readFileSync(envPath, 'utf-8');
    const match = envContent.match(/^ANTHROPIC_API_KEY=(.+)$/m);
    if (match && match[1].trim()) {
      cachedApiKey = match[1].trim();
      return cachedApiKey;
    }
  } catch {
    // .env.local doesn't exist (e.g., on Vercel) — that's fine
  }

  throw new Error('ANTHROPIC_API_KEY not found. Set it in Vercel environment variables or .env.local');
}

export function createClaudeClient(): Anthropic {
  return new Anthropic({ apiKey: getAnthropicApiKey() });
}

/**
 * LLM Provider Factory
 * 
 * Creates the appropriate LLM provider based on environment configuration.
 * 
 * Configuration (wrangler.toml vars or secrets):
 * 
 * | Provider    | LLM_PROVIDER | Required Secret      | Where to get it                              |
 * |-------------|--------------|----------------------|----------------------------------------------|
 * | Cloudflare  | "cloudflare" | (none, uses AI bind) | Add [ai] binding to wrangler.toml            |
 * | OpenAI      | "openai"     | OPENAI_API_KEY       | https://platform.openai.com/api-keys         |
 * | Google      | "google"     | GOOGLE_AI_API_KEY    | https://aistudio.google.com/apikey            |
 * | Anthropic   | "anthropic"  | ANTHROPIC_API_KEY    | https://console.anthropic.com/settings/keys   |
 * 
 * Optional: LLM_MODEL to override the default model for the selected provider.
 */

import type { LLMProvider, LLMProviderType } from './types';
import { createCloudflareProvider } from './providers/cloudflare';
import { createOpenAIProvider } from './providers/openai';
import { createGoogleProvider } from './providers/google';
import { createAnthropicProvider } from './providers/anthropic';

export type { LLMProvider, LLMProviderType, LLMMessage, LLMCompletionRequest, LLMCompletionResponse } from './types';

interface LLMEnv {
  LLM_PROVIDER?: string;
  LLM_MODEL?: string;
  OPENAI_API_KEY?: string;
  GOOGLE_AI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  AI?: { run: (...args: any[]) => Promise<unknown> };
}

export function createLLMProvider(env: LLMEnv): LLMProvider {
  const providerType = (env.LLM_PROVIDER || 'cloudflare') as LLMProviderType;
  const modelOverride = env.LLM_MODEL;

  switch (providerType) {
    case 'cloudflare':
      if (!env.AI) {
        throw new Error(
          'Cloudflare Workers AI binding not found. Add [ai] binding = "AI" to wrangler.toml'
        );
      }
      return createCloudflareProvider(env.AI, modelOverride);

    case 'openai':
      if (!env.OPENAI_API_KEY) {
        throw new Error(
          'OPENAI_API_KEY secret not configured. Run: wrangler secret put OPENAI_API_KEY'
        );
      }
      return createOpenAIProvider(env.OPENAI_API_KEY, modelOverride);

    case 'google':
      if (!env.GOOGLE_AI_API_KEY) {
        throw new Error(
          'GOOGLE_AI_API_KEY secret not configured. Run: wrangler secret put GOOGLE_AI_API_KEY'
        );
      }
      return createGoogleProvider(env.GOOGLE_AI_API_KEY, modelOverride);

    case 'anthropic':
      if (!env.ANTHROPIC_API_KEY) {
        throw new Error(
          'ANTHROPIC_API_KEY secret not configured. Run: wrangler secret put ANTHROPIC_API_KEY'
        );
      }
      return createAnthropicProvider(env.ANTHROPIC_API_KEY, modelOverride);

    default:
      throw new Error(
        `Unknown LLM_PROVIDER: "${providerType}". Valid options: cloudflare, openai, google, anthropic`
      );
  }
}

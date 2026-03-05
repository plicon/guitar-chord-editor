/**
 * LLM Provider Abstraction Types
 * 
 * Supports multiple LLM backends:
 * - cloudflare: Cloudflare Workers AI (no API key needed, uses env.AI binding)
 * - openai: OpenAI API (requires OPENAI_API_KEY secret)
 * - google: Google Gemini API (requires GOOGLE_AI_API_KEY secret)
 * - anthropic: Anthropic API (requires ANTHROPIC_API_KEY secret)
 * 
 * To configure:
 * 1. Set LLM_PROVIDER env var in wrangler.toml (default: "cloudflare")
 * 2. Set LLM_MODEL env var to override the default model for that provider
 * 3. For non-Cloudflare providers, add the API key as a secret:
 *    - wrangler secret put OPENAI_API_KEY
 *    - wrangler secret put GOOGLE_AI_API_KEY
 *    - wrangler secret put ANTHROPIC_API_KEY
 */

export type LLMProviderType = 'cloudflare' | 'openai' | 'google' | 'anthropic';

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMCompletionRequest {
  messages: LLMMessage[];
  /** Optional: override the model for this request */
  model?: string;
  /** Max tokens to generate (default: provider-specific) */
  maxTokens?: number;
  /** Temperature 0-1 (default: 0.3 for structured output) */
  temperature?: number;
}

export interface LLMCompletionResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface LLMProvider {
  readonly name: LLMProviderType;
  readonly defaultModel: string;
  complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse>;
}

/**
 * Default models per provider
 */
export const DEFAULT_MODELS: Record<LLMProviderType, string> = {
  cloudflare: '@cf/meta/llama-3.1-8b-instruct',
  openai: 'gpt-4o-mini',
  google: 'gemini-2.5-flash',
  anthropic: 'claude-sonnet-4-20250514',
};

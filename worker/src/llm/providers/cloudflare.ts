/**
 * Cloudflare Workers AI Provider
 * 
 * No API key required — uses the AI binding from wrangler.toml.
 * Add to wrangler.toml:
 *   [ai]
 *   binding = "AI"
 */

import type { LLMProvider, LLMCompletionRequest, LLMCompletionResponse } from '../types';
import { DEFAULT_MODELS } from '../types';

export function createCloudflareProvider(ai: any, modelOverride?: string): LLMProvider {
  const defaultModel = modelOverride || DEFAULT_MODELS.cloudflare;

  return {
    name: 'cloudflare',
    defaultModel,

    async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
      const model = request.model || defaultModel;

      const result = await ai.run(model, {
        messages: request.messages,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature ?? 0.3,
      });

      return {
        content: result.response || '',
        model,
      };
    },
  };
}

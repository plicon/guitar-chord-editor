/**
 * Anthropic Provider
 * 
 * Requires: ANTHROPIC_API_KEY secret
 * Set via: wrangler secret put ANTHROPIC_API_KEY
 * Get key from: https://console.anthropic.com/settings/keys
 */

import type { LLMProvider, LLMCompletionRequest, LLMCompletionResponse } from '../types';
import { DEFAULT_MODELS } from '../types';

export function createAnthropicProvider(apiKey: string, modelOverride?: string): LLMProvider {
  const defaultModel = modelOverride || DEFAULT_MODELS.anthropic;

  return {
    name: 'anthropic',
    defaultModel,

    async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
      const model = request.model || defaultModel;

      // Anthropic uses a separate system param
      const systemMessage = request.messages
        .filter((m) => m.role === 'system')
        .map((m) => m.content)
        .join('\n');

      const messages = request.messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          system: systemMessage || undefined,
          messages,
          max_tokens: request.maxTokens || 4096,
          temperature: request.temperature ?? 0.3,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Anthropic API error (${response.status}): ${error}`);
      }

      const data = await response.json() as { content?: Array<{ text?: string }>; model?: string; usage?: { input_tokens?: number; output_tokens?: number } };
      const text = data.content?.[0]?.text || '';

      return {
        content: text,
        model: data.model,
        usage: {
          promptTokens: data.usage?.input_tokens,
          completionTokens: data.usage?.output_tokens,
          totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
        },
      };
    },
  };
}

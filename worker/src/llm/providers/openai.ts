/**
 * OpenAI Provider
 * 
 * Requires: OPENAI_API_KEY secret
 * Set via: wrangler secret put OPENAI_API_KEY
 */

import type { LLMProvider, LLMCompletionRequest, LLMCompletionResponse } from '../types';
import { DEFAULT_MODELS } from '../types';

export function createOpenAIProvider(apiKey: string, modelOverride?: string): LLMProvider {
  const defaultModel = modelOverride || DEFAULT_MODELS.openai;

  return {
    name: 'openai',
    defaultModel,

    async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
      const model = request.model || defaultModel;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: request.messages,
          max_tokens: request.maxTokens || 4096,
          temperature: request.temperature ?? 0.3,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`OpenAI API error (${response.status}): ${error}`);
      }

      const data = await response.json() as any;
      return {
        content: data.choices[0]?.message?.content || '',
        model: data.model,
        usage: {
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens,
          totalTokens: data.usage?.total_tokens,
        },
      };
    },
  };
}

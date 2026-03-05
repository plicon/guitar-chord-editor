/**
 * Google Gemini Provider
 * 
 * Requires: GOOGLE_AI_API_KEY secret
 * Set via: wrangler secret put GOOGLE_AI_API_KEY
 * Get key from: https://aistudio.google.com/apikey
 */

import type { LLMProvider, LLMCompletionRequest, LLMCompletionResponse } from '../types';
import { DEFAULT_MODELS } from '../types';

export function createGoogleProvider(apiKey: string, modelOverride?: string): LLMProvider {
  const defaultModel = modelOverride || DEFAULT_MODELS.google;

  return {
    name: 'google',
    defaultModel,

    async complete(request: LLMCompletionRequest): Promise<LLMCompletionResponse> {
      const model = request.model || defaultModel;

      // Convert OpenAI-style messages to Gemini format
      const systemInstruction = request.messages
        .filter((m) => m.role === 'system')
        .map((m) => m.content)
        .join('\n');

      const contents = request.messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: systemInstruction
              ? { parts: [{ text: systemInstruction }] }
              : undefined,
            contents,
            generationConfig: {
              maxOutputTokens: request.maxTokens || 4096,
              temperature: request.temperature ?? 0.3,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Google AI API error (${response.status}): ${error}`);
      }

      const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number } };
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return {
        content: text,
        model,
        usage: {
          promptTokens: data.usageMetadata?.promptTokenCount,
          completionTokens: data.usageMetadata?.candidatesTokenCount,
          totalTokens: data.usageMetadata?.totalTokenCount,
        },
      };
    },
  };
}

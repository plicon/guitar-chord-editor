/**
 * Tests for LLM Provider Factory
 */
import { describe, it, expect, vi } from 'vitest';
import { createLLMProvider } from '../../worker/src/llm';

describe('createLLMProvider', () => {
  it('defaults to google provider', () => {
    const provider = createLLMProvider({
      GOOGLE_AI_API_KEY: 'test-key',
    });
    expect(provider.name).toBe('google');
  });

  it('throws when google API key is missing for default provider', () => {
    expect(() => createLLMProvider({}))
      .toThrow('GOOGLE_AI_API_KEY secret not configured');
  });

  it('creates openai provider with API key', () => {
    const provider = createLLMProvider({
      LLM_PROVIDER: 'openai',
      OPENAI_API_KEY: 'sk-test',
    });
    expect(provider.name).toBe('openai');
    expect(provider.defaultModel).toBe('gpt-4o-mini');
  });

  it('throws when openai API key is missing', () => {
    expect(() => createLLMProvider({ LLM_PROVIDER: 'openai' }))
      .toThrow('OPENAI_API_KEY secret not configured');
  });

  it('creates google provider with API key', () => {
    const provider = createLLMProvider({
      LLM_PROVIDER: 'google',
      GOOGLE_AI_API_KEY: 'test-key',
    });
    expect(provider.name).toBe('google');
    expect(provider.defaultModel).toBe('gemini-2.5-flash');
  });

  it('throws when google API key is missing', () => {
    expect(() => createLLMProvider({ LLM_PROVIDER: 'google' }))
      .toThrow('GOOGLE_AI_API_KEY secret not configured');
  });

  it('creates anthropic provider with API key', () => {
    const provider = createLLMProvider({
      LLM_PROVIDER: 'anthropic',
      ANTHROPIC_API_KEY: 'sk-ant-test',
    });
    expect(provider.name).toBe('anthropic');
    expect(provider.defaultModel).toContain('claude');
  });

  it('throws when anthropic API key is missing', () => {
    expect(() => createLLMProvider({ LLM_PROVIDER: 'anthropic' }))
      .toThrow('ANTHROPIC_API_KEY secret not configured');
  });

  it('throws for unknown provider', () => {
    expect(() => createLLMProvider({ LLM_PROVIDER: 'unknown' } as Parameters<typeof createLLMProvider>[0]))
      .toThrow('Unknown LLM_PROVIDER: "unknown"');
  });

  it('respects LLM_MODEL override for google', () => {
    const provider = createLLMProvider({
      GOOGLE_AI_API_KEY: 'test-key',
      LLM_MODEL: 'gemini-2.0-pro',
    });
    expect(provider.defaultModel).toBe('gemini-2.0-pro');
  });

  it('respects LLM_MODEL override for openai', () => {
    const provider = createLLMProvider({
      LLM_PROVIDER: 'openai',
      OPENAI_API_KEY: 'sk-test',
      LLM_MODEL: 'gpt-4o',
    });
    expect(provider.defaultModel).toBe('gpt-4o');
  });
});

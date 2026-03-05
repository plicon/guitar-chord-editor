/**
 * Tests for Chord Chart Generator
 * 
 * Tests the LLM response parsing and prompt building logic.
 */
import { describe, it, expect, vi } from 'vitest';
import { generateChordChart } from '../../worker/src/services/chordChartGenerator';
import type { LLMProvider } from '../../worker/src/llm';
import type { TranscriptResult } from '../../worker/src/services/youtube';

function createMockTranscript(overrides?: Partial<TranscriptResult>): TranscriptResult {
  return {
    metadata: {
      videoId: 'test123',
      title: 'How to play Wonderwall - Oasis',
      author: 'Guitar Teacher',
      description: 'Learn Wonderwall by Oasis on guitar',
    },
    segments: [
      { text: 'Hey everyone, today we are learning Wonderwall', start: 0, duration: 3 },
      { text: 'The chords for the verse are Em7 G Dsus4 A7sus4', start: 5, duration: 4 },
      { text: 'For the chorus we play C D Em', start: 40, duration: 3 },
    ],
    fullText: 'Hey everyone today we are learning Wonderwall The chords for the verse are Em7 G Dsus4 A7sus4 For the chorus we play C D Em',
    ...overrides,
  };
}

function createMockLLM(responseContent: string): LLMProvider {
  return {
    name: 'openai',
    defaultModel: 'gpt-4o-mini',
    complete: vi.fn().mockResolvedValue({
      content: responseContent,
      model: 'gpt-4o-mini',
    }),
  };
}

describe('generateChordChart', () => {
  it('parses valid JSON response from LLM', async () => {
    const llm = createMockLLM(JSON.stringify({
      title: 'Wonderwall',
      artist: 'Oasis',
      key: 'Em',
      sections: [
        { name: 'Verse', type: 'verse', chords: ['Em7', 'G', 'Dsus4', 'A7sus4'] },
        { name: 'Chorus', type: 'chorus', chords: ['C', 'D', 'Em'] },
      ],
    }));

    const result = await generateChordChart(llm, createMockTranscript());

    expect(result.title).toBe('Wonderwall');
    expect(result.artist).toBe('Oasis');
    expect(result.key).toBe('Em');
    expect(result.sections).toHaveLength(2);
    expect(result.sections[0].chords).toEqual(['Em7', 'G', 'Dsus4', 'A7sus4']);
    expect(result.sections[1].type).toBe('chorus');
  });

  it('strips markdown code fences from response', async () => {
    const json = JSON.stringify({
      title: 'Test',
      sections: [{ name: 'Verse', type: 'verse', chords: ['Am'] }],
    });
    const llm = createMockLLM('```json\n' + json + '\n```');

    const result = await generateChordChart(llm, createMockTranscript());
    expect(result.title).toBe('Test');
    expect(result.sections).toHaveLength(1);
  });

  it('extracts JSON from prose text with code fences', async () => {
    const json = JSON.stringify({
      title: 'Tennessee Whiskey',
      artist: 'Chris Stapleton',
      sections: [{ name: 'Verse', type: 'verse', chords: ['A', 'Bm'] }],
    });
    const llm = createMockLLM('. The following is a detailed chord chart for the song.\n```json\n' + json + '\n```');

    const result = await generateChordChart(llm, createMockTranscript());
    expect(result.title).toBe('Tennessee Whiskey');
    expect(result.sections).toHaveLength(1);
  });

  it('extracts JSON when LLM returns prose before raw JSON', async () => {
    const json = JSON.stringify({
      title: 'Test',
      sections: [{ name: 'Verse', type: 'verse', chords: ['C'] }],
    });
    const llm = createMockLLM('Here is the chord chart:\n' + json);

    const result = await generateChordChart(llm, createMockTranscript());
    expect(result.title).toBe('Test');
  });

  it('defaults title to Untitled when missing', async () => {
    const llm = createMockLLM(JSON.stringify({
      sections: [{ name: 'Verse', type: 'verse', chords: ['C'] }],
    }));

    const result = await generateChordChart(llm, createMockTranscript());
    expect(result.title).toBe('Untitled');
  });

  it('defaults section name and type when missing', async () => {
    const llm = createMockLLM(JSON.stringify({
      title: 'Test',
      sections: [{ chords: ['Am', 'C'] }],
    }));

    const result = await generateChordChart(llm, createMockTranscript());
    expect(result.sections[0].name).toBe('Section');
    expect(result.sections[0].type).toBe('custom');
  });

  it('throws on invalid JSON response', async () => {
    const llm = createMockLLM('This is not valid JSON at all');

    await expect(generateChordChart(llm, createMockTranscript()))
      .rejects.toThrow('Failed to parse LLM response as JSON');
  });

  it('throws when sections array is missing', async () => {
    const llm = createMockLLM(JSON.stringify({ title: 'Test' }));

    await expect(generateChordChart(llm, createMockTranscript()))
      .rejects.toThrow('Response missing "sections" array');
  });

  it('passes correct messages to LLM', async () => {
    const llm = createMockLLM(JSON.stringify({
      title: 'Test',
      sections: [{ name: 'V', type: 'verse', chords: ['C'] }],
    }));

    await generateChordChart(llm, createMockTranscript());

    expect(llm.complete).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({ role: 'system' }),
          expect.objectContaining({ role: 'user' }),
        ]),
        temperature: 0.2,
        maxTokens: 16384,
      })
    );
  });

  it('includes video metadata in user prompt', async () => {
    const llm = createMockLLM(JSON.stringify({
      title: 'Test',
      sections: [{ name: 'V', type: 'verse', chords: ['C'] }],
    }));

    await generateChordChart(llm, createMockTranscript());

    const call = vi.mocked(llm.complete).mock.calls[0][0];
    const userMessage = call.messages.find((m: { role: string }) => m.role === 'user');
    expect(userMessage.content).toContain('Wonderwall');
    expect(userMessage.content).toContain('Guitar Teacher');
  });

  it('handles chords field as non-array gracefully', async () => {
    const llm = createMockLLM(JSON.stringify({
      title: 'Test',
      sections: [{ name: 'V', type: 'verse', chords: 'not-an-array' }],
    }));

    const result = await generateChordChart(llm, createMockTranscript());
    expect(result.sections[0].chords).toEqual([]);
  });

  it('converts numeric tempo to number', async () => {
    const llm = createMockLLM(JSON.stringify({
      title: 'Test',
      tempo: '120',
      sections: [{ name: 'V', type: 'verse', chords: ['Am'] }],
    }));

    const result = await generateChordChart(llm, createMockTranscript());
    expect(result.tempo).toBe(120);
  });

  it('groups transcript segments into time-based chunks', async () => {
    const transcript = createMockTranscript({
      segments: [
        { text: 'Start', start: 0, duration: 2 },
        { text: 'Still early', start: 10, duration: 2 },
        { text: 'Later section', start: 45, duration: 2 },
        { text: 'Much later', start: 90, duration: 2 },
      ],
    });

    const llm = createMockLLM(JSON.stringify({
      title: 'Test',
      sections: [{ name: 'V', type: 'verse', chords: ['C'] }],
    }));

    await generateChordChart(llm, transcript);

    const call = vi.mocked(llm.complete).mock.calls[0][0];
    const userContent = call.messages.find((m: { role: string }) => m.role === 'user')!.content;
    // Should have multiple timestamp markers due to >30s gaps
    expect(userContent).toContain('[0:00]');
    expect(userContent).toContain('[0:45]');
  });

  it('repairs truncated JSON with missing closing brackets', async () => {
    // Simulate the exact truncation from the user's error
    const truncated = '{"title":"Sky Full of Stars","artist":"Coldplay","sections":[{"name":"Intro","type":"intro","chords":["Am","Fmaj7","C","Em"]},{"name":"Verse","type":"verse","chords":["Am","Fmaj7","C","Em"]},{"name":"Pre-Chorus","type":"pre-chorus","chords":["Am","Fmaj7","C';
    const llm = createMockLLM(truncated);

    const result = await generateChordChart(llm, createMockTranscript());
    expect(result.title).toBe('Sky Full of Stars');
    expect(result.artist).toBe('Coldplay');
    expect(result.sections.length).toBeGreaterThanOrEqual(2);
    expect(result.sections[0].chords).toEqual(['Am', 'Fmaj7', 'C', 'Em']);
  });

  it('repairs truncated JSON wrapped in code fences', async () => {
    const truncated = '```json\n{"title":"Test","sections":[{"name":"Verse","type":"verse","chords":["Am","C"';
    const llm = createMockLLM(truncated);

    const result = await generateChordChart(llm, createMockTranscript());
    expect(result.title).toBe('Test');
    expect(result.sections).toHaveLength(1);
  });

  it('parses tab data in sections', async () => {
    const response = JSON.stringify({
      title: 'Tab Song',
      sections: [
        {
          name: 'Intro Riff',
          type: 'intro',
          chords: [],
          tab: [
            'e|---0---|',
            'B|---1---|',
            'G|---0---|',
            'D|---2---|',
            'A|---3---|',
            'E|-------|',
          ],
        },
        {
          name: 'Verse',
          type: 'verse',
          chords: ['Am', 'C'],
        },
      ],
    });
    const llm = createMockLLM(response);

    const result = await generateChordChart(llm, createMockTranscript());
    expect(result.sections).toHaveLength(2);
    expect(result.sections[0].tab).toBeDefined();
    expect(result.sections[0].tab).toHaveLength(6);
    expect(result.sections[0].chords).toEqual([]);
    expect(result.sections[1].tab).toBeUndefined();
    expect(result.sections[1].chords).toEqual(['Am', 'C']);
  });
});

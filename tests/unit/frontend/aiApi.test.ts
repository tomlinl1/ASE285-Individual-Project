import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('sendToGemini', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    delete process.env.VITE_GEMINI_API_KEY;
  });

  it('throws when VITE_GEMINI_API_KEY is missing', async () => {
    const { sendToGemini } = await import('../../../src/services/aiApi');
    await expect(sendToGemini({ messages: [{ role: 'user', content: 'hi' }] })).rejects.toThrow(
      'Missing VITE_GEMINI_API_KEY'
    );
  });

  it('throws a Gemini API error when HTTP response is not ok', async () => {
    process.env.VITE_GEMINI_API_KEY = 'k';

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        return new Response(JSON.stringify({ error: { message: 'Nope' } }), {
          status: 401,
          statusText: 'Unauthorized',
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );

    const { sendToGemini } = await import('../../../src/services/aiApi');
    await expect(sendToGemini({ messages: [{ role: 'user', content: 'hi' }], model: 'm' })).rejects.toThrow(
      'Gemini API error: Nope'
    );
  });
});


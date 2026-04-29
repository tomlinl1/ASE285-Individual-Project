import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from '../../../src/services/apiClient';

function mockFetchOnce(impl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
  vi.stubGlobal('fetch', vi.fn(impl));
}

describe('ApiClient', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('adds Authorization header when token present', async () => {
    mockFetchOnce(async (_input, init) => {
      const headers = new Headers(init?.headers);
      expect(headers.get('Authorization')).toBe('Bearer t1');
      expect(headers.get('Content-Type')).toBe('application/json');
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });

    const api = new ApiClient({ getToken: () => 't1' });
    await api.get('/api/health');
  });

  it('throws server {error} message on non-OK response', async () => {
    mockFetchOnce(async () => {
      return new Response(JSON.stringify({ error: 'Bad things' }), {
        status: 400,
        statusText: 'Bad Request',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const api = new ApiClient({ getToken: () => null });
    await expect(api.get('/api/health')).rejects.toThrow('Bad things');
  });

  it('getText returns plain text body', async () => {
    mockFetchOnce(async () => {
      return new Response('hello', { status: 200, headers: { 'Content-Type': 'text/plain' } });
    });

    const api = new ApiClient({ getToken: () => 't2' });
    await expect(api.getText('/api/x')).resolves.toBe('hello');
  });
});


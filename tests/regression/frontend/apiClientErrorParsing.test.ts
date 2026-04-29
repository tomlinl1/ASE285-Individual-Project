import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from '../../../src/services/apiClient';

describe('Regression: ApiClient error parsing', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('falls back to statusText when response body is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        return new Response('not json', { status: 500, statusText: 'Server Error' });
      })
    );

    const api = new ApiClient({ getToken: () => null });
    await expect(api.get('/api/health')).rejects.toThrow('Server Error');
  });
});


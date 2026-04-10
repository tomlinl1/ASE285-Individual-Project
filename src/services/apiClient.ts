export interface ApiClientOptions {
  getToken: () => string | null;
}

export class ApiClient {
  private getToken: () => string | null;
  private baseUrl: string;

  constructor(options: ApiClientOptions) {
    this.getToken = options.getToken;
    this.baseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';
  }

  async request<T>(path: string, init?: RequestInit): Promise<T> {
    const token = this.getToken();
    const headers = new Headers(init?.headers ?? {});
    headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const res = await fetch(`${this.baseUrl}${path}`, { ...init, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const message = (err as { error?: string })?.error ?? res.statusText;
      throw new Error(message);
    }
    return (await res.json()) as T;
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) });
  }

  /** For endpoints that return plain text or markdown (not JSON). */
  async getText(path: string): Promise<string> {
    const token = this.getToken();
    const headers = new Headers();
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const res = await fetch(`${this.baseUrl}${path}`, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const message = (err as { error?: string })?.error ?? res.statusText;
      throw new Error(message);
    }
    return res.text();
  }
}


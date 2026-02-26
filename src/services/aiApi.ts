/**
 * Gemini API integration for AI Study Hub.
 * Uses Google Gemini generateContent REST API.
 */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const DEFAULT_MODEL = 'gemini-1.5-flash';

export interface ChatTurn {
  role: 'user' | 'model';
  content: string;
}

export interface SendMessageOptions {
  messages: ChatTurn[];
  model?: string;
}

function getApiKey(): string {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) {
    throw new Error(
      'Missing VITE_GEMINI_API_KEY. Add it to your .env file. See README for setup.'
    );
  }
  return key;
}

/**
 * Convert our chat turns to Gemini contents format.
 */
function toGeminiContents(messages: ChatTurn[]): Array<{ role: string; parts: Array<{ text: string }> }> {
  return messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));
}

/**
 * Call Gemini generateContent and return the model reply text.
 */
export async function sendToGemini(options: SendMessageOptions): Promise<string> {
  const { messages, model = DEFAULT_MODEL } = options;
  const apiKey = getApiKey();
  const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    contents: toGeminiContents(messages),
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = (err as { error?: { message?: string } })?.error?.message ?? res.statusText;
    throw new Error(`Gemini API error: ${message}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
  };

  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
  return text || '(No response generated)';
}

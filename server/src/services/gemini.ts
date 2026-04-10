import { env } from '../utils/env.js';

type GeminiContent = { role: 'user' | 'model'; parts: Array<{ text: string }> };

export async function generateGeminiReply(turns: Array<{ role: 'user' | 'model'; text: string }>): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`;

  const contents: GeminiContent[] = turns.map((t) => ({
    role: t.role,
    parts: [{ text: t.text }],
  }));

  const body = {
    contents,
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
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
  return text || '(No response generated)';
}


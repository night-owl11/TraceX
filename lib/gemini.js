// Minimal Google Gemini REST client with structured JSON output.
// Returns parsed JSON, or null on any failure (callers fall back to the local engine).

export function geminiEnabled() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function callGeminiJSON({ system, prompt, schema, timeoutMs = 25000 }) {
  if (!geminiEnabled()) return null;
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      }),
    });
    if (!res.ok) {
      console.error('[gemini] HTTP', res.status, (await res.text()).slice(0, 300));
      return null;
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    return JSON.parse(text);
  } catch (e) {
    console.error('[gemini] failed:', e?.message || e);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

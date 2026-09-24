const MODELS = (process.env.GEMINI_MODEL || 'gemini-3.6-flash,gemini-3-flash-preview')
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

const ATTEMPTS_PER_MODEL = 2;

async function callModel(model, key, body) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

  for (let attempt = 0; attempt < ATTEMPTS_PER_MODEL; attempt++) {
    const isLastAttempt = attempt === ATTEMPTS_PER_MODEL - 1;
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: AbortSignal.timeout(25000),
      });
    } catch (err) {
      if (isLastAttempt) throw err;
      continue;
    }

    if (res.status === 503 && !isLastAttempt) {
      await new Promise((r) => setTimeout(r, 700 * (attempt + 1)));
      continue;
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Gemini API (${model}) ${res.status}: ${detail.slice(0, 300)}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('').trim();
    if (!text) throw new Error(`Gemini (${model}) returned an empty response`);
    return text;
  }
}

// Thin wrapper over Gemini's generateContent REST API. Tries each model in
// GEMINI_MODEL (comma-separated, first is preferred) in turn, retrying each
// on a transient 503 ("model overloaded") — Gemini's shared capacity is
// flaky enough that a single model/attempt isn't reliable for a live demo.
async function generateText(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    const err = new Error('GEMINI_API_KEY not configured');
    err.code = 'NO_KEY';
    throw err;
  }

  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    // thinkingBudget: 0 disables these models' default "thinking" pass, which
    // otherwise burns most of maxOutputTokens on hidden reasoning and can
    // leave zero tokens for the actual draft.
    generationConfig: { temperature: 0.7, maxOutputTokens: 1400, thinkingConfig: { thinkingBudget: 0 } },
  });

  let lastErr;
  for (const model of MODELS) {
    try {
      return await callModel(model, key, body);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

module.exports = { generateText };

// Problem generation for Step 3 (challenge) and Step 4 (fresh test).
// Tries Gemini first (validated by running its own reference solution), falls back to the curated bank.

import { CHALLENGES, FRESH } from '@/lib/bank';
import { TAXONOMY } from '@/lib/misconceptions';
import { callGeminiJSON, geminiEnabled } from '@/lib/gemini';
import { runInSandbox } from '@/lib/sandbox';
import { seal } from '@/lib/seal';

const str = { type: 'STRING' };
const PROBLEM_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: str,
    prompt: str,
    focus: str,
    fnName: str,
    starterCode: str,
    referenceSolution: str,
    tests: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { name: str, category: str, args: str, expected: str },
        required: ['name', 'category', 'args', 'expected'],
      },
    },
  },
  required: ['title', 'prompt', 'fnName', 'starterCode', 'referenceSolution', 'tests'],
};

const SYSTEM = `You write tiny JavaScript coding exercises for a misconception-driven tutor.
Return JSON. "args" is a JSON-encoded ARRAY of the function's arguments (e.g. "[[1,2,3], 2]"). "expected" is the JSON-encoded return value.
The referenceSolution must be a correct, self-contained JavaScript function named fnName that passes every test. Provide 5–9 tests including edge cases (empty input, size 1, size 2, boundaries).
Never use external libraries, I/O, randomness or time.`;

function parseTests(raw, visibleCount) {
  if (!Array.isArray(raw)) return null;
  try {
    return raw.map((x, i) => ({
      name: String(x.name).slice(0, 80),
      category: String(x.category || 'case').slice(0, 40),
      args: JSON.parse(x.args),
      expected: JSON.parse(x.expected),
      visible: i < visibleCount,
    }));
  } catch {
    return null;
  }
}

async function fromGemini(kind, misconceptionId, avoidTitle) {
  if (!geminiEnabled()) return null;
  const m = TAXONOMY[misconceptionId] || TAXONOMY.INTERVAL_INVARIANT_MISMATCH;
  const prompt =
    kind === 'challenge'
      ? `Create a TARGETED DIAGNOSTIC CHALLENGE for the misconception "${m.title}" (${m.summary}).
It must be a small function (≤15 lines) that is NOT a binary search, whose starterCode contains exactly one bug caused by this misconception. The prompt asks the student to find and fix it. Put the key question the student should ask themselves in "focus". Start with a comment in starterCode describing the intended behaviour.`
      : `Create a FRESH VERIFICATION PROBLEM that depends on the same underlying skill as the misconception "${m.title}" (${m.summary}) but looks different on the surface (e.g. a search over answers, an insertion point, a boundary-finding task).${
          avoidTitle ? ` It must NOT be "${avoidTitle}".` : ''
        } starterCode is only a function signature with a "// your code here" comment. Tests are hidden from the student; add a one-sentence "focus".`;

  const g = await callGeminiJSON({ system: SYSTEM, prompt, schema: PROBLEM_SCHEMA });
  if (!g || !/^[A-Za-z_$][\w$]*$/.test(g.fnName || '')) return null;
  const tests = parseTests(g.tests, kind === 'challenge' ? 2 : 0);
  if (!tests || tests.length < 4) return null;

  // Validate: the reference solution must pass every generated test inside the sandbox.
  const check = runInSandbox({ code: g.referenceSolution, fnName: g.fnName, tests });
  if (!check.ok) {
    console.warn('[problems] gemini problem rejected — reference failed its own tests');
    return null;
  }
  // For challenges the starter must actually be broken, otherwise it is not diagnostic.
  if (kind === 'challenge') {
    const starter = runInSandbox({ code: g.starterCode, fnName: g.fnName, tests });
    if (starter.ok) return null;
  }
  return {
    id: `gem-${kind}-${Date.now()}`,
    title: g.title,
    prompt: g.prompt,
    focus: g.focus,
    fnName: g.fnName,
    starterCode: g.starterCode,
    tests,
  };
}

function fromBank(kind, misconceptionId, excludeId) {
  if (kind === 'challenge') {
    const c = CHALLENGES[misconceptionId] || CHALLENGES.INTERVAL_INVARIANT_MISMATCH;
    return { ...c, tests: c.tests };
  }
  const pool = FRESH.filter((f) => f.id !== excludeId);
  const list = pool.length ? pool : FRESH;
  const f = list[Math.floor(Math.random() * list.length)];
  return { ...f, tests: f.tests.map((t) => ({ ...t, hidden: true })) };
}

export async function makeProblem({ kind, misconceptionId, excludeId, excludeTitle }) {
  let source = 'gemini';
  let p = await fromGemini(kind, misconceptionId, excludeTitle);
  if (!p) {
    p = fromBank(kind, misconceptionId, excludeId);
    source = 'curated-bank';
  }
  if (kind === 'fresh') p.tests = p.tests.map((t) => ({ ...t, hidden: true }));
  else p.tests = p.tests.map((t) => ({ ...t, hidden: t.visible === false }));

  const token = seal({ kind, id: p.id, title: p.title, fnName: p.fnName, misconceptionId, tests: p.tests });

  return {
    id: p.id,
    kind,
    title: p.title,
    prompt: p.prompt,
    focus: p.focus || null,
    fnName: p.fnName,
    starterCode: p.starterCode,
    // Only expose visible examples (challenge). Fresh problems expose nothing but a count.
    examples: p.tests
      .filter((t) => !t.hidden)
      .map((t) => ({ args: t.args, expected: t.expected, name: t.name })),
    hiddenCount: p.tests.filter((t) => t.hidden).length,
    totalTests: p.tests.length,
    token,
    source,
  };
}

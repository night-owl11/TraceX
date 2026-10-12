import { NextResponse } from 'next/server';
import { unseal } from '@/lib/seal';
import { runInSandbox } from '@/lib/sandbox';
import { analyzeBoundaries } from '@/lib/analysis';
import { MAX_CODE } from '@/lib/evidence';

export const runtime = 'nodejs';
export const maxDuration = 30;

// POST /api/check  { token, code }  →  graded results.
// Hidden tests never leave the server: only name/category/pass-fail are returned for them.
export async function POST(req) {
  try {
    const { token, code } = await req.json();
    if (typeof code !== 'string' || !code.trim()) return NextResponse.json({ error: 'No code submitted.' }, { status: 400 });
    if (code.length > MAX_CODE) return NextResponse.json({ error: 'Code is too long.' }, { status: 413 });
    const payload = unseal(token || '');
    if (!payload) return NextResponse.json({ error: 'Invalid or expired problem token. Please regenerate the problem.' }, { status: 400 });

    const run = runInSandbox({ code, fnName: payload.fnName, tests: payload.tests });

    const results = run.results.map((r) =>
      r.hidden
        ? { name: r.name, category: r.category, hidden: true, passed: r.passed, error: r.error && r.error.startsWith('Timeout') ? r.error : null }
        : { name: r.name, category: r.category, hidden: false, passed: r.passed, args: r.args, expected: r.expected, actual: r.actual, error: r.error },
    );

    // Conceptual check: tests passing is not enough — the interval reasoning must also be sound.
    const analysis = analyzeBoundaries(code);
    const conceptual = { ok: !analysis.mismatch, signals: analysis.signals, convention: analysis.convention };

    const allPassed = run.ok;
    return NextResponse.json({
      kind: payload.kind,
      passed: run.passed,
      total: run.total,
      allPassed,
      results,
      logs: run.logs.slice(0, 40),
      conceptual,
      mastered: payload.kind === 'fresh' ? allPassed && conceptual.ok : allPassed,
      loadError: run.loadError,
    });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Check failed' }, { status: 500 });
  }
}

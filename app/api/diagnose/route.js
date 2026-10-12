import { NextResponse } from 'next/server';
import { collectEvidence, MAX_CODE } from '@/lib/evidence';
import { diagnose } from '@/lib/diagnose';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST /api/diagnose  { code }  →  structured misconception diagnosis (Gemini or local engine)
// Evidence is recomputed server-side from the code, so the client cannot forge traces.
export async function POST(req) {
  try {
    const { code } = await req.json();
    if (typeof code !== 'string' || !code.trim()) return NextResponse.json({ error: 'No code submitted.' }, { status: 400 });
    if (code.length > MAX_CODE) return NextResponse.json({ error: 'Code is too long.' }, { status: 413 });
    const { execution, analysis } = collectEvidence(code);
    const diagnosis = await diagnose({ code, execution, analysis });
    return NextResponse.json({ diagnosis });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Diagnosis failed' }, { status: 500 });
  }
}

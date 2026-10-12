import { NextResponse } from 'next/server';
import { collectEvidence, MAX_CODE } from '@/lib/evidence';

export const runtime = 'nodejs';
export const maxDuration = 30;

// POST /api/run  { code }  →  { execution, analysis }
export async function POST(req) {
  try {
    const { code } = await req.json();
    if (typeof code !== 'string' || !code.trim()) return NextResponse.json({ error: 'No code submitted.' }, { status: 400 });
    if (code.length > MAX_CODE) return NextResponse.json({ error: 'Code is too long.' }, { status: 413 });
    return NextResponse.json(collectEvidence(code));
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Run failed' }, { status: 500 });
  }
}

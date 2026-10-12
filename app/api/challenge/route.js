import { NextResponse } from 'next/server';
import { makeProblem } from '@/lib/problems';
import { TAXONOMY_IDS } from '@/lib/misconceptions';

export const runtime = 'nodejs';
export const maxDuration = 60;

// POST /api/challenge  { kind: 'challenge' | 'fresh', misconceptionId, excludeId?, excludeTitle? }
export async function POST(req) {
  try {
    const body = await req.json();
    const kind = body.kind === 'fresh' ? 'fresh' : 'challenge';
    let misconceptionId = TAXONOMY_IDS.includes(body.misconceptionId) ? body.misconceptionId : 'INTERVAL_INVARIANT_MISMATCH';
    if (misconceptionId === 'NONE' || misconceptionId === 'LOGIC_ERROR_UNCLASSIFIED') misconceptionId = 'INTERVAL_INVARIANT_MISMATCH';
    const problem = await makeProblem({
      kind,
      misconceptionId,
      excludeId: body.excludeId,
      excludeTitle: body.excludeTitle,
    });
    return NextResponse.json({ problem });
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Could not create problem' }, { status: 500 });
  }
}

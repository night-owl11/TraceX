import { PRIMARY, formatArgs } from '@/lib/primary';
import { TAXONOMY, TAXONOMY_IDS } from '@/lib/misconceptions';
import { callGeminiJSON, geminiEnabled } from '@/lib/gemini';

const str = { type: 'STRING' };
const DIAGNOSIS_SCHEMA = {
  type: 'OBJECT',
  properties: {
    misconceptionId: { type: 'STRING', enum: TAXONOMY_IDS },
    title: str,
    confidence: { type: 'NUMBER' },
    mentalModelFlaw: str,
    whyItBreaks: str,
    evidence: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { kind: { type: 'STRING', enum: ['test', 'trace', 'static', 'stderr'] }, text: str },
        required: ['kind', 'text'],
      },
    },
    socraticQuestions: { type: 'ARRAY', items: str },
    conceptPrimer: str,
    challengeFocus: str,
  },
  required: ['misconceptionId', 'title', 'confidence', 'mentalModelFlaw', 'whyItBreaks', 'evidence', 'socraticQuestions', 'conceptPrimer', 'challengeFocus'],
};

const SYSTEM = `You are TraceX, a Socratic coding tutor and "misconception detective".
You receive EXECUTION EVIDENCE (failing tests, array-read traces, variable mutation traces, static findings) from a student's code.
Your job is to diagnose the underlying CONCEPTUAL misconception in the student's mental model — not just restate the bug.
Rules:
- NEVER output corrected code or a drop-in fix. Explain the flawed mental model instead.
- Ground every claim in the provided evidence; cite concrete values (e.g. "left=0, right=0 after right = mid - 1").
- misconceptionId MUST be one of the allowed ids. Use NONE only if all tests pass and no static findings exist.
- Write for a motivated beginner. Be specific, kind, concise. 2–4 evidence items, 2–3 Socratic questions.`;

export function failingSummary(execution) {
  return execution.results
    .filter((r) => !r.passed)
    .map((r) => `${PRIMARY.fnName}(${formatArgs(r.args)}) → ${r.error ? r.error : r.actual}, expected ${r.expected}`);
}

function traceString(events, max = 14) {
  return events
    .slice(0, max)
    .map((e) => `${e.name}=${e.value}`)
    .join(' → ');
}

export function localDiagnosis({ execution, analysis }) {
  const failed = execution.results.filter((r) => !r.passed);
  const firstFail = failed[0];
  const evidence = [];

  if (firstFail) {
    evidence.push({
      kind: 'test',
      text: `${failed.length} of ${execution.total} tests failed. First: ${PRIMARY.fnName}(${formatArgs(firstFail.args)}) returned ${
        firstFail.error || firstFail.actual
      } but expected ${firstFail.expected}.`,
    });
    if (firstFail.events?.length) {
      evidence.push({
        kind: 'trace',
        text: `State mutations on that call: ${traceString(firstFail.events)}${firstFail.events.length > 14 ? ' …' : ''}.`,
      });
    }
    const oob = firstFail.reads?.filter((r) => r.oob) || [];
    if (oob.length) {
      evidence.push({ kind: 'trace', text: `The code read arr[${oob[0].index}], which is outside the array (value: ${oob[0].value}).` });
    }
    if (firstFail.error) evidence.push({ kind: 'stderr', text: firstFail.error });
  }
  for (const s of analysis.signals) evidence.push({ kind: 'static', text: `Line ${s.line ?? '?'}: ${s.label}. ${s.detail}` });

  const has = (id) => analysis.signals.some((s) => s.id === id);
  const timedOut = failed.some((r) => r.error && r.error.startsWith('TimeoutError'));

  if (!failed.length && !analysis.mismatch) {
    return {
      misconceptionId: 'NONE',
      title: TAXONOMY.NONE.title,
      confidence: 0.9,
      mentalModelFlaw: 'Your interval bookkeeping is consistent and every test passes.',
      whyItBreaks: 'Nothing to diagnose — your mental model of the search interval held up on every test, including size-1 and size-2 arrays.',
      evidence: [{ kind: 'test', text: `All ${execution.total} tests passed.` }],
      socraticQuestions: ['Can you state, in one sentence, what is always true about [left, right] at the top of each loop iteration?'],
      conceptPrimer: 'A loop invariant is a statement that stays true before every iteration; naming it is the best defence against boundary bugs.',
      challengeFocus: 'Confirm your understanding with a fresh problem.',
    };
  }

  if (has('MIXED_INTERVAL_CONVENTIONS') || has('SKIPPED_FINAL_CANDIDATE')) {
    const mixed = has('MIXED_INTERVAL_CONVENTIONS');
    return {
      misconceptionId: 'INTERVAL_INVARIANT_MISMATCH',
      title: TAXONOMY.INTERVAL_INVARIANT_MISMATCH.title,
      confidence: 0.92,
      mentalModelFlaw: mixed
        ? 'You are treating `right` as an exclusive upper bound when you initialise it (arr.length) but as an inclusive bound when you update it (mid - 1). Each rule is valid on its own; mixed together they break the invariant "the target, if present, lies inside the interval".'
        : 'You are treating `right` as an inclusive bound when you initialise it (arr.length - 1) but the strict "<" loop condition behaves as if it were exclusive, so the last remaining candidate never gets inspected.',
      whyItBreaks: mixed
        ? 'With a half-open interval [left, right), `mid` is already excluded when you shrink the right side, so `right = mid` is enough. Writing `right = mid - 1` also throws away index mid - 1, which may hold the target. On a 2-element array like [2, 4] searching for 2: mid = 1, arr[1] = 4 is too big, so right becomes 0 and the loop condition left < right (0 < 0) fails before index 0 is ever checked.'
        : 'When left === right the interval still contains one candidate if bounds are inclusive. A strict "<" exits before looking at it.',
      evidence,
      socraticQuestions: [
        'Right after `let right = arr.length`, is arr[right] a valid element you might return? So is `right` inside the search interval or just outside it?',
        'If the interval is [left, right) and you have just ruled out arr[mid], what is the smallest change to `right` that still keeps every unchecked candidate inside the interval?',
        'For the array [2, 4] and target 2, write down left, right and mid on paper after each loop pass. At which step does the target fall out of the interval?',
      ],
      conceptPrimer:
        'Pick ONE interval convention and make initialisation, loop condition and both pointer updates obey it. Half-open [lo, hi): hi = length, loop while lo < hi, hi = mid, lo = mid + 1. Closed [lo, hi]: hi = length - 1, loop while lo <= hi, hi = mid - 1, lo = mid + 1.',
      challengeFocus: 'Spot and fix a half-open / inclusive disagreement in a tiny, non-search function.',
    };
  }

  if (has('OUT_OF_BOUNDS_PROBE')) {
    return {
      misconceptionId: 'OUT_OF_BOUNDS_ACCESS',
      title: TAXONOMY.OUT_OF_BOUNDS_ACCESS.title,
      confidence: 0.85,
      mentalModelFlaw: 'You are treating arr.length as if it were the last valid index. Arrays are zero-indexed, so valid indices stop at length - 1.',
      whyItBreaks: 'Probing arr[arr.length] yields undefined, comparisons with undefined are always false, and the search takes the wrong branch.',
      evidence,
      socraticQuestions: ['For an array of 4 elements, which index holds the last element?', 'What does JavaScript return for an index past the end?'],
      conceptPrimer: 'Length counts elements; indices count from 0. The last element is at length - 1.',
      challengeFocus: 'Fix an off-by-one that reads one slot past the end.',
    };
  }

  if (has('NO_PROGRESS_UPDATE') || timedOut) {
    return {
      misconceptionId: 'NO_PROGRESS_LOOP',
      title: TAXONOMY.NO_PROGRESS_LOOP.title,
      confidence: 0.85,
      mentalModelFlaw: 'You assume every iteration shrinks the search interval, but one branch can set a bound to a value it already has.',
      whyItBreaks: 'When the interval has width 1, mid equals left, so `left = mid` changes nothing and the loop repeats forever.',
      evidence,
      socraticQuestions: ['After one iteration, is [left, right] strictly smaller in every branch?', 'What are left, right and mid when right - left === 1?'],
      conceptPrimer: 'A terminating loop needs a measure (like right - left) that strictly decreases each pass.',
      challengeFocus: 'Repair a loop whose update fails to shrink the interval.',
    };
  }

  return {
    misconceptionId: 'LOGIC_ERROR_UNCLASSIFIED',
    title: TAXONOMY.LOGIC_ERROR_UNCLASSIFIED.title,
    confidence: 0.4,
    mentalModelFlaw: 'The failing tests do not match a known boundary pattern, so the flaw is probably in how the comparison result is used.',
    whyItBreaks: 'Trace one failing call by hand and compare each pointer value against what you expected.',
    evidence,
    socraticQuestions: ['Which line first produces a value that differs from your hand trace?'],
    conceptPrimer: 'Hand-tracing the smallest failing input is the fastest way to expose a wrong mental model.',
    challengeFocus: 'Practice boundary reasoning with a small drill.',
  };
}

export async function diagnose({ code, execution, analysis }) {
  const local = localDiagnosis({ execution, analysis });

  if (geminiEnabled()) {
    const failed = execution.results.filter((r) => !r.passed).slice(0, 3);
    const prompt = `PROBLEM: ${PRIMARY.title} — ${PRIMARY.prompt}
ALLOWED misconceptionId values: ${TAXONOMY_IDS.join(', ')}

STUDENT CODE:
${code}

EXECUTION EVIDENCE (${execution.passed}/${execution.total} tests passed):
${failed
  .map(
    (r) => `- ${PRIMARY.fnName}(${formatArgs(r.args)}) => ${r.error || r.actual}; expected ${r.expected}
  state mutations: ${traceString(r.events, 20) || 'n/a'}
  array reads: ${(r.reads || []).slice(0, 12).map((x) => `arr[${x.index}]=${x.value}${x.oob ? ' (OUT OF BOUNDS)' : ''}`).join(', ') || 'n/a'}`,
  )
  .join('\n')}

STATIC FINDINGS: ${JSON.stringify(analysis.signals)}
DETECTED CONVENTION: ${JSON.stringify(analysis.convention)}

Diagnose the misconception. Do not include corrected code.`;

    const g = await callGeminiJSON({ system: SYSTEM, prompt, schema: DIAGNOSIS_SCHEMA });
    if (
      g &&
      TAXONOMY_IDS.includes(g.misconceptionId) &&
      typeof g.mentalModelFlaw === 'string' &&
      Array.isArray(g.evidence) &&
      g.evidence.length &&
      Array.isArray(g.socraticQuestions)
    ) {
      // Guard rails: never let the model's output contain a fenced code solution.
      if (!/```/.test(JSON.stringify(g))) {
        return { ...g, confidence: Math.max(0, Math.min(1, Number(g.confidence) || 0.7)), source: 'gemini' };
      }
    }
  }
  return { ...local, source: 'local-engine' };
}

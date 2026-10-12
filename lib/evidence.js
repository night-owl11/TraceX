import { PRIMARY } from '@/lib/primary';
import { runInSandbox } from '@/lib/sandbox';
import { analyzeBoundaries } from '@/lib/analysis';

export const MAX_CODE = 20000;

// Execute the student's Step-1 code against the problem and gather evidence.
export function collectEvidence(code) {
  const execution = runInSandbox({
    code,
    fnName: PRIMARY.fnName,
    tests: PRIMARY.tests,
    trackVars: PRIMARY.trackVars,
  });
  const analysis = analyzeBoundaries(code);
  return { execution, analysis };
}

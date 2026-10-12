// Lightweight static ("AST-style") insights about the student's binary-search-family code.
// Detects the *interval convention* the student used and whether the pieces agree.

function lineOf(code, re) {
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) if (re.test(lines[i])) return i + 1;
  return null;
}

export function analyzeBoundaries(code) {
  const signals = [];

  const init = code.match(/\b(right|hi|high|end)\s*=\s*([\w.]+)\.length\s*(-\s*1)?\s*[;,]/);
  const loop = code.match(/while\s*\(\s*(\w+)\s*(<=|<)\s*(\w+)\s*\)/);
  const rUpd = code.match(/\b(right|hi|high|end)\s*=\s*mid\s*(-\s*1)?\s*;/);
  const lUpd = code.match(/\b(left|lo|low|start)\s*=\s*mid\s*(\+\s*1)?\s*;/);

  const convention = {
    init: init ? (init[3] ? 'closed [left, right]' : 'half-open [left, right)') : 'unknown',
    loop: loop ? loop[2] : null,
    rightUpdate: rUpd ? (rUpd[2] ? 'mid - 1' : 'mid') : null,
    leftUpdate: lUpd ? (lUpd[2] ? 'mid + 1' : 'mid') : null,
  };

  const halfOpen = init && !init[3];
  const closed = init && init[3];
  const strict = loop && loop[2] === '<';
  const inclusive = loop && loop[2] === '<=';
  const rightMinus1 = rUpd && rUpd[2];
  const rightMid = rUpd && !rUpd[2];
  const leftMid = lUpd && !lUpd[2];

  if (halfOpen && strict && rightMinus1) {
    signals.push({
      id: 'MIXED_INTERVAL_CONVENTIONS',
      label: 'Half-open bounds with closed-interval update',
      detail:
        `right starts as arr.length (exclusive bound) and the loop runs while ${loop[1]} < ${loop[3]}, ` +
        `but right is later set to mid - 1, which is what you would do for an inclusive bound. ` +
        `The element at index mid - 1 is silently dropped from the search space.`,
      line: lineOf(code, /right\s*=\s*mid\s*-\s*1/) || lineOf(code, /right\s*=/),
    });
  }
  if (halfOpen && inclusive) {
    signals.push({
      id: 'OUT_OF_BOUNDS_PROBE',
      label: 'Inclusive loop over an exclusive bound',
      detail: `right starts at arr.length but the loop uses <=, so arr[arr.length] (out of bounds) can be probed.`,
      line: lineOf(code, /while\s*\(/),
    });
  }
  if (closed && strict) {
    signals.push({
      id: 'SKIPPED_FINAL_CANDIDATE',
      label: 'Closed bounds with a strict loop condition',
      detail: `right = arr.length - 1 is an inclusive bound, so the loop must keep running when left === right; "<" stops one step too early.`,
      line: lineOf(code, /while\s*\(/),
    });
  }
  if (loop && (leftMid || (closed && inclusive && rightMid))) {
    signals.push({
      id: 'NO_PROGRESS_UPDATE',
      label: 'Pointer update that may not shrink the interval',
      detail: `Setting a bound to mid (without ±1) can leave [left, right] unchanged when the interval has width 1, so the loop never terminates.`,
      line: lineOf(code, /\b(left|lo|low|start|right|hi|high|end)\s*=\s*mid\s*;/),
    });
  }

  return {
    convention,
    signals,
    mismatch: signals.length > 0,
    detected: Boolean(init || loop),
  };
}

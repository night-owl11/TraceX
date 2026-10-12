// Curated fallback problems (used when Gemini is not configured or returns an invalid problem).
// SERVER ONLY — contains hidden tests and reference solutions.

const t = (name, category, args, expected, extra = {}) => ({ name, category, args, expected, ...extra });

// ─── Step 3: targeted diagnostic challenges (one per misconception) ─────────────────────────
export const CHALLENGES = {
  INTERVAL_INVARIANT_MISMATCH: {
    id: 'ch-halfopen-window',
    title: 'The Half-Open Window',
    fnName: 'sumWindow',
    prompt:
      'Intervals in this API are **half-open**: `sumWindow(arr, lo, hi)` must add up `arr[lo], arr[lo+1], …, arr[hi-1]` — `hi` itself is **excluded**. The function below is wrong. Predict what it returns for `sumWindow([1,2,3], 0, 3)`, then fix it so every test passes without changing the half-open meaning of `hi`.',
    focus: 'Does every part of your code agree on whether the upper bound is inclusive or exclusive?',
    starterCode: `function sumWindow(arr, lo, hi) {
  // Sum arr[lo] ... arr[hi - 1]   (hi is EXCLUSIVE)
  let total = 0;
  for (let i = lo; i <= hi; i++) {
    total += arr[i];
  }
  return total;
}
`,
    tests: [
      t('middle window', 'basic', [[1, 2, 3, 4, 5], 1, 3], 5, { visible: true }),
      t('whole array', 'upper bound = length', [[1, 2, 3], 0, 3], 6, { visible: true }),
      t('empty window', 'lo === hi', [[1, 2, 3], 2, 2], 0, { visible: false }),
      t('single element', 'width 1', [[7, 8, 9], 1, 2], 8, { visible: false }),
      t('empty array', 'empty', [[], 0, 0], 0, { visible: false }),
    ],
    referenceSolution: `function sumWindow(arr, lo, hi){ let s=0; for(let i=lo;i<hi;i++) s+=arr[i]; return s; }`,
  },

  OUT_OF_BOUNDS_ACCESS: {
    id: 'ch-last-index',
    title: 'The Last Valid Index',
    fnName: 'lastElement',
    prompt:
      'Return the **last element** of `arr`, or `-1` if the array is empty. The starter code reads one slot too far. Fix it.',
    focus: 'What is the highest valid index of an array with n elements?',
    starterCode: `function lastElement(arr) {
  if (arr.length === 0) return -1;
  return arr[arr.length];
}
`,
    tests: [
      t('three elements', 'basic', [[4, 5, 6]], 6, { visible: true }),
      t('single element', 'size 1', [[9]], 9, { visible: true }),
      t('empty array', 'empty', [[]], -1, { visible: false }),
      t('negatives', 'values', [[-3, -2]], -2, { visible: false }),
    ],
    referenceSolution: `function lastElement(a){ return a.length? a[a.length-1] : -1; }`,
  },

  NO_PROGRESS_LOOP: {
    id: 'ch-progress',
    title: 'Does the Interval Shrink?',
    fnName: 'firstGreater',
    prompt:
      'Return the smallest index `i` with `arr[i] > x`, or `arr.length` if none (arr is sorted ascending). The starter code **never terminates** on some inputs. Find the update that fails to shrink the interval and repair it.',
    focus: 'After every iteration, is the interval [lo, hi) strictly smaller than before?',
    starterCode: `function firstGreater(arr, x) {
  let lo = 0;
  let hi = arr.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (arr[mid] > x) hi = mid;
    else lo = mid;
  }
  return lo;
}
`,
    tests: [
      t('value present', 'basic', [[1, 3, 5], 3], 2, { visible: true }),
      t('smaller than all', 'left edge', [[1, 3, 5], 0], 0, { visible: true }),
      t('greater than all', 'right edge', [[1, 3, 5], 5], 3, { visible: false }),
      t('empty array', 'empty', [[], 1], 0, { visible: false }),
      t('single element', 'size 1', [[2], 2], 1, { visible: false }),
    ],
    referenceSolution: `function firstGreater(a,x){ let lo=0,hi=a.length; while(lo<hi){ const m=(lo+hi)>>1; if(a[m]>x) hi=m; else lo=m+1; } return lo; }`,
  },
};

// ─── Step 4: fresh, unexposed verification problems ─────────────────────────────────────────
export const FRESH = [
  {
    id: 'fresh-search-insert',
    title: 'Search Insert Position',
    fnName: 'searchInsert',
    prompt:
      'Given a sorted array of **distinct** integers and a `target`, return the index where `target` is found. If it is not found, return the index where it **would be inserted** to keep the array sorted. Aim for O(log n). *This problem is new — you have not seen it, and its tests are hidden.*',
    starterCode: `function searchInsert(arr, target) {
  // your code here
}
`,
    tests: [
      t('found in middle', 'hit', [[1, 3, 5, 6], 5], 2),
      t('insert in middle', 'miss-middle', [[1, 3, 5, 6], 2], 1),
      t('insert at end', 'past end', [[1, 3, 5, 6], 7], 4),
      t('insert at start', 'before start', [[1, 3, 5, 6], 0], 0),
      t('empty array', 'empty', [[], 3], 0),
      t('single, found', 'size 1', [[4], 4], 0),
      t('single, smaller', 'size 1', [[4], 2], 0),
      t('single, larger', 'size 1', [[4], 9], 1),
      t('pair, find first', 'size 2', [[2, 6], 2], 0),
      t('pair, insert between', 'size 2', [[2, 6], 4], 1),
      t('long array, second element', 'left-of-middle', [[1, 2, 4, 8, 16, 32, 64, 128], 2], 1),
    ],
    referenceSolution: `function searchInsert(a,t){ let lo=0,hi=a.length; while(lo<hi){ const m=(lo+hi)>>1; if(a[m]<t) lo=m+1; else hi=m; } return lo; }`,
  },
  {
    id: 'fresh-isqrt',
    title: 'Integer Square Root',
    fnName: 'mySqrt',
    prompt:
      'Return the integer part of the square root of a non-negative integer `n` (e.g. `mySqrt(8) = 2`). Do not use `Math.sqrt`, `**0.5`, or similar — use a search over candidate answers. *This problem is new, and its tests are hidden.*',
    starterCode: `function mySqrt(n) {
  // your code here
}
`,
    tests: [
      t('zero', 'edge', [0], 0),
      t('one', 'edge', [1], 1),
      t('two', 'small', [2], 1),
      t('perfect square', 'exact', [16], 4),
      t('non-square', 'floor', [8], 2),
      t('just below a square', 'floor', [15], 3),
      t('just above a square', 'floor', [26], 5),
      t('large perfect square', 'large', [2147395600], 46340),
      t('large non-square', 'large', [2147483647], 46340),
    ],
    referenceSolution: `function mySqrt(n){ let lo=0,hi=n+1; while(lo<hi){ const m=Math.floor((lo+hi)/2); if(m*m<=n) lo=m+1; else hi=m; } return lo-1; }`,
  },
];

// The Step-1 problem. Safe to import on both client and server (all tests are visible in Step 1).

export const PRIMARY = {
  id: 'binary-search',
  title: 'Binary Search',
  difficulty: 'Easy',
  fnName: 'binarySearch',
  trackVars: ['left', 'right', 'mid'],
  prompt:
    'Given a sorted array of distinct integers `arr` and an integer `target`, return the index of `target` in `arr`, or -1 if it is not present. Your solution must run in O(log n) time.',
  constraints: [
    '0 ≤ arr.length ≤ 10⁵',
    'arr is sorted in ascending order, all values distinct',
    'Return -1 when the target is absent',
  ],
  examples: [
    { input: 'binarySearch([1, 3, 5, 7, 9], 5)', output: '2' },
    { input: 'binarySearch([1, 3, 5, 7], 4)', output: '-1' },
  ],
  starterCode: `function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length;

  while (left < right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }

  return -1;
}
`,
  tests: [
    { name: 'target in the middle', category: 'middle hit', args: [[1, 3, 5, 7, 9], 5], expected: 2 },
    { name: 'target is first element', category: 'left edge', args: [[1, 3, 5, 7, 9], 1], expected: 0 },
    { name: 'target is second element', category: 'left-of-middle', args: [[1, 3, 5, 7], 3], expected: 1 },
    { name: 'target is last element', category: 'right edge', args: [[1, 3, 5, 7, 9], 9], expected: 4 },
    { name: 'target absent', category: 'miss', args: [[1, 3, 5, 7], 4], expected: -1 },
    { name: 'single element, present', category: 'size 1', args: [[2], 2], expected: 0 },
    { name: 'two elements, find first', category: 'size 2', args: [[2, 4], 2], expected: 0 },
    { name: 'two elements, find second', category: 'size 2', args: [[2, 4], 4], expected: 1 },
  ],
};

export function formatArgs(args) {
  return args.map((a) => JSON.stringify(a)).join(', ');
}

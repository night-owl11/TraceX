// Misconception taxonomy used by the diagnosis engine and the Gemini response schema.

export const TAXONOMY = {
  INTERVAL_INVARIANT_MISMATCH: {
    title: 'Interval invariant mismatch (half-open vs closed bounds)',
    category: 'Boundary reasoning',
    summary:
      'The learner picks bound initialisation, loop condition and pointer updates from different interval conventions, so the search invariant is broken.',
  },
  OUT_OF_BOUNDS_ACCESS: {
    title: 'Treating the length as a valid index',
    category: 'Zero-indexing',
    summary: 'The learner reads or iterates up to arr.length as if it were the last valid index.',
  },
  NO_PROGRESS_LOOP: {
    title: 'Loop that does not guarantee progress',
    category: 'Termination reasoning',
    summary: 'The learner updates a pointer in a way that can leave the search interval unchanged, so the loop never ends.',
  },
  LOGIC_ERROR_UNCLASSIFIED: {
    title: 'Unclassified logic error',
    category: 'General',
    summary: 'Tests fail but the evidence does not match a known misconception pattern.',
  },
  NONE: {
    title: 'No misconception detected',
    category: 'None',
    summary: 'All tests passed and the interval conventions are consistent.',
  },
};

export const TAXONOMY_IDS = Object.keys(TAXONOMY);

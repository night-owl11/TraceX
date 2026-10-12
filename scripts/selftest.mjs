// Run: npm run test:sandbox
// Verifies the buggy starter fails, every curated reference passes its tests, and every
// curated challenge starter is genuinely broken. Uses a tiny loader for the "@/" alias and
// treats lib/*.js as ES modules (the project has no "type": "module").
import { register } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
register(
  'data:text/javascript,' +
    encodeURIComponent(`
  const root = ${JSON.stringify(root)};
  export async function resolve(spec, ctx, next) {
    if (spec.startsWith('@/')) {
      let p = root + '/' + spec.slice(2);
      if (!/\\.[mc]?js$/.test(p)) p += '.js';
      return { url: 'file://' + p, shortCircuit: true };
    }
    return next(spec, ctx);
  }
  export async function load(url, ctx, next) {
    if (url.startsWith('file://' + root + '/lib/')) return next(url, { ...ctx, format: 'module' });
    return next(url, ctx);
  }
`),
);

const imp = (f) => import(pathToFileURL(path.join(root, f)).href);
const { runInSandbox } = await imp('lib/sandbox.js');
const { PRIMARY } = await imp('lib/primary.js');
const { CHALLENGES, FRESH } = await imp('lib/bank.js');
const { analyzeBoundaries } = await imp('lib/analysis.js');

let failures = 0;
const expect = (label, cond) => {
  console.log(`${cond ? '✔' : '✘'} ${label}`);
  if (!cond) failures++;
};

const primary = runInSandbox({ code: PRIMARY.starterCode, fnName: PRIMARY.fnName, tests: PRIMARY.tests, trackVars: PRIMARY.trackVars });
expect(`primary starter is buggy (${primary.passed}/${primary.total} pass, expected 6/8)`, primary.passed === 6);
expect('primary starter was instrumented', primary.instrumented);
const failing = primary.results.find((r) => !r.passed);
expect('failing call has state-mutation trace', !!failing && failing.events.length > 0);
expect('static analysis flags mixed conventions', analyzeBoundaries(PRIMARY.starterCode).signals.some((s) => s.id === 'MIXED_INTERVAL_CONVENTIONS'));

const fixed = PRIMARY.starterCode.replace('right = mid - 1', 'right = mid');
expect('fixed primary passes all tests', runInSandbox({ code: fixed, fnName: PRIMARY.fnName, tests: PRIMARY.tests }).ok);
expect('fixed primary has no static signals', !analyzeBoundaries(fixed).mismatch);

for (const [id, c] of Object.entries(CHALLENGES)) {
  expect(`challenge ${id}: reference passes`, runInSandbox({ code: c.referenceSolution, fnName: c.fnName, tests: c.tests }).ok);
  expect(`challenge ${id}: starter is broken`, !runInSandbox({ code: c.starterCode, fnName: c.fnName, tests: c.tests }).ok);
}
for (const f of FRESH) {
  expect(`fresh ${f.id}: reference passes`, runInSandbox({ code: f.referenceSolution, fnName: f.fnName, tests: f.tests }).ok);
}

const loop = runInSandbox({ code: 'function f(){ while(true){} }', fnName: 'f', tests: [{ name: 'x', args: [], expected: 1 }], timeoutMs: 200 });
expect('infinite loop is stopped by timeout', /Timeout/.test(loop.results[0].error || ''));
const esc = runInSandbox({ code: 'function f(){ return typeof process + typeof require; }', fnName: 'f', tests: [{ name: 'x', args: [], expected: 'undefinedundefined' }] });
expect('sandbox exposes no process/require', esc.ok);

process.exit(failures ? 1 : 0);

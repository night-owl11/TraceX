// Sandboxed execution + evidence capture.
//
// Runs student JavaScript in an isolated V8 context (node:vm) with:
//   • no require/process/fs/network (empty global),
//   • eval / new Function disabled,
//   • a hard per-call timeout (catches infinite loops),
//   • array arguments wrapped in a Proxy that records every index read (incl. out-of-bounds),
//   • light source instrumentation that records mutations of pointer variables (left/right/mid…).
//
// NOTE: node:vm is NOT a hardened security boundary. For untrusted production traffic, swap
// `runInSandbox` for a call to an isolated runtime (Cloud Run job / gVisor / Firecracker /
// isolated-vm / Judge0). The return shape below is the contract the rest of the app depends on.

import vm from 'node:vm';

const NUM = /^\d+$/;
const IDENT = /^[A-Za-z_$][\w$]*$/;
const MAX_EVENTS = 80;
const MAX_READS = 60;
const MAX_LOG = 200;

export function fmt(v) {
  if (typeof v === 'string') return v;
  if (v === undefined) return 'undefined';
  if (typeof v === 'number' && Number.isNaN(v)) return 'NaN';
  try {
    const s = JSON.stringify(v);
    return s === undefined ? String(v) : s;
  } catch {
    return String(v);
  }
}

function describeError(e, timeoutMs) {
  if (e && e.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
    return `TimeoutError: execution exceeded ${timeoutMs}ms — likely an infinite loop`;
  }
  return `${(e && e.name) || 'Error'}: ${(e && e.message) || String(e)}`;
}

// Append trace probes after pointer-variable declarations / assignments.
export function instrument(code, vars) {
  const names = vars.join('|');
  const declRe = new RegExp(`\\b(?:let|const|var)\\s+(${names})\\s*=\\s*[^;,]+;`, 'g');
  const assignRe = new RegExp(`(?<![\\w.$<>=!])(${names})\\s*[+-]?=(?!=)\\s*[^;]+;`, 'g');
  return code
    .split('\n')
    .map((line) => {
      if (/^\s*\/\//.test(line)) return line;
      if (declRe.test(line)) {
        declRe.lastIndex = 0;
        return line.replace(declRe, (m, n) => `${m} __t("${n}", ${n});`);
      }
      declRe.lastIndex = 0;
      return line.replace(assignRe, (m, n) => `{ ${m} __t("${n}", ${n}); }`);
    })
    .join('\n');
}

export function runInSandbox({ code, fnName, tests, trackVars = [], timeoutMs = 800 }) {
  if (!IDENT.test(fnName)) throw new Error('Invalid function name');

  const t0 = performance.now();
  const logs = [];
  let currentTest = null;
  let events = [];

  const sink = (stream) => (...a) => {
    if (logs.length < MAX_LOG) logs.push({ stream, test: currentTest, text: a.map(fmt).join(' ') });
  };
  const sandboxConsole = { log: sink('stdout'), info: sink('stdout'), warn: sink('stderr'), error: sink('stderr') };

  const makeContext = () =>
    vm.createContext(
      {
        console: sandboxConsole,
        __t: (name, value) => {
          if (events.length < MAX_EVENTS) events.push({ name, value: fmt(value) });
        },
      },
      { codeGeneration: { strings: false, wasm: false } },
    );

  const load = (src) => {
    const c = makeContext();
    new vm.Script(src, { filename: 'student.js' }).runInContext(c, { timeout: timeoutMs });
    return c;
  };

  let context = null;
  let loadError = null;
  let instrumented = false;

  if (trackVars.length) {
    try {
      context = load(instrument(code, trackVars));
      instrumented = true;
    } catch {
      context = null;
    }
  }
  if (!context) {
    try {
      context = load(code);
    } catch (e) {
      loadError = describeError(e, timeoutMs);
    }
  }

  let fn = null;
  if (context) {
    try {
      fn = vm.runInContext(`typeof ${fnName} === 'function' ? ${fnName} : null`, context);
    } catch {
      fn = null;
    }
    if (!fn) loadError = `ReferenceError: function ${fnName} is not defined`;
  }

  const results = [];
  let timedOut = false;

  for (const test of tests) {
    const base = {
      name: test.name,
      category: test.category,
      hidden: !!test.hidden,
      visible: test.visible !== false,
      args: test.args,
      expected: fmt(test.expected),
    };

    if (loadError || !fn) {
      results.push({ ...base, actual: 'n/a', passed: false, error: loadError, reads: [], events: [], ms: 0 });
      continue;
    }
    if (timedOut) {
      results.push({ ...base, actual: 'n/a', passed: false, error: 'Skipped: an earlier test timed out', reads: [], events: [], ms: 0 });
      continue;
    }

    events = [];
    currentTest = test.name;
    const reads = [];
    const args = test.args.map((a) =>
      Array.isArray(a)
        ? new Proxy([...a], {
            get(target, prop, receiver) {
              if (typeof prop === 'string' && NUM.test(prop) && reads.length < MAX_READS) {
                const i = Number(prop);
                reads.push({ index: i, value: fmt(target[i]), oob: i >= target.length });
              }
              return Reflect.get(target, prop, receiver);
            },
          })
        : structuredClone(a),
    );

    context.__fn = fn;
    context.__args = args;

    const s = performance.now();
    let actual;
    let error = null;
    try {
      actual = vm.runInContext('__fn(...__args)', context, { timeout: timeoutMs });
    } catch (e) {
      error = describeError(e, timeoutMs);
      if (e && e.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') timedOut = true;
    }

    const actualStr = error ? 'n/a' : fmt(actual);
    results.push({
      ...base,
      actual: actualStr,
      passed: !error && actualStr === base.expected,
      error,
      reads,
      events: events.slice(),
      ms: Math.round((performance.now() - s) * 10) / 10,
    });
  }

  const passed = results.filter((r) => r.passed).length;
  return {
    ok: passed === results.length,
    passed,
    total: results.length,
    results,
    logs,
    instrumented,
    loadError,
    durationMs: Math.round(performance.now() - t0),
    runtime: 'node:vm sandbox (simulated Cloud Run isolate)',
  };
}

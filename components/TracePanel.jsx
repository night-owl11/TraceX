'use client';

import { useState } from 'react';
import { CheckCircle2, ChevronDown, Cpu, ListTree, ScanSearch, Terminal, XCircle } from 'lucide-react';
import { PRIMARY, formatArgs } from '@/lib/primary';

const VAR_STYLE = {
  left: 'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  right: 'border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300',
  mid: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300',
};

function TestRow({ r, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <li className={`rounded-xl border ${r.passed ? 'border-emerald-500/25' : 'border-rose-500/40 bg-rose-500/5'}`}>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm">
        {r.passed ? <CheckCircle2 size={16} className="shrink-0 text-emerald-500" /> : <XCircle size={16} className="shrink-0 text-rose-500" />}
        <span className="min-w-0 flex-1 truncate font-mono text-xs">
          {PRIMARY.fnName}({formatArgs(r.args)})
        </span>
        <span className="font-mono text-xs text-slate-500">
          {r.error ? 'error' : `${r.actual}`} {!r.passed && <span className="text-rose-500">≠ {r.expected}</span>}
        </span>
        <ChevronDown size={14} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="space-y-3 border-t border-slate-200/70 px-3 py-3 dark:border-white/10">
          <div>
            <p className="label mb-1.5">State mutations</p>
            {r.events.length ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {r.events.map((e, i) => (
                  <span key={i} className={`chip ${VAR_STYLE[e.name] || 'border-slate-300 text-slate-600'}`}>
                    {e.name}={e.value}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No pointer variables were recorded.</p>
            )}
          </div>
          <div>
            <p className="label mb-1.5">Array reads</p>
            {r.reads.length ? (
              <div className="flex flex-wrap gap-1.5">
                {r.reads.map((x, i) => (
                  <span
                    key={i}
                    className={`chip ${x.oob ? 'border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-300' : 'border-slate-300 text-slate-600 dark:border-white/15 dark:text-slate-300'}`}
                  >
                    arr[{x.index}]={x.value}
                    {x.oob && ' ⚠ out of bounds'}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">The array was never read.</p>
            )}
          </div>
          {r.error && <p className="font-mono text-xs text-rose-600 dark:text-rose-300">{r.error}</p>}
        </div>
      )}
    </li>
  );
}

export default function TracePanel({ evidence }) {
  const { execution, analysis } = evidence;
  const firstFail = execution.results.findIndex((r) => !r.passed);
  const errors = execution.results.filter((r) => r.error).map((r) => ({ stream: 'stderr', test: r.name, text: r.error }));
  const consoleLines = [...execution.logs, ...errors.slice(0, 3)];

  return (
    <section className="glass flex flex-col gap-5 p-5 animate-fade-up">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
          <Cpu size={18} className="text-cyan-500" /> Execution evidence
        </h3>
        <span className={`chip ${execution.ok ? 'border-emerald-500/40 text-emerald-600' : 'border-rose-500/40 text-rose-600 dark:text-rose-300'}`}>
          {execution.passed}/{execution.total} passed · {execution.durationMs}ms
        </span>
      </header>
      <p className="-mt-3 text-[11px] text-slate-500">{execution.runtime}</p>

      <div>
        <p className="label mb-2 flex items-center gap-1.5"><ListTree size={12} /> Test runs — expand a row for its trace</p>
        <ul className="space-y-2">
          {execution.results.map((r, i) => (
            <TestRow key={i} r={r} defaultOpen={i === firstFail} />
          ))}
        </ul>
      </div>

      <div>
        <p className="label mb-2 flex items-center gap-1.5"><Terminal size={12} /> stdout / stderr</p>
        <div className="max-h-36 overflow-auto rounded-xl border border-slate-200 bg-slate-950 p-3 font-mono text-xs dark:border-white/10">
          {consoleLines.length ? (
            consoleLines.map((l, i) => (
              <div key={i} className={l.stream === 'stderr' ? 'text-rose-400' : 'text-slate-200'}>
                <span className="text-slate-500">[{l.test}] </span>
                {l.text}
              </div>
            ))
          ) : (
            <span className="text-slate-500">No console output and no runtime errors — the program ran to completion but returned wrong values.</span>
          )}
        </div>
      </div>

      <div>
        <p className="label mb-2 flex items-center gap-1.5"><ScanSearch size={12} /> Static insights</p>
        <div className="mb-2 flex flex-wrap gap-1.5">
          <span className="chip border-slate-300 dark:border-white/15">init: {analysis.convention.init}</span>
          <span className="chip border-slate-300 dark:border-white/15">loop: {analysis.convention.loop ? `left ${analysis.convention.loop} right` : '—'}</span>
          <span className="chip border-slate-300 dark:border-white/15">right update: {analysis.convention.rightUpdate ?? '—'}</span>
        </div>
        {analysis.signals.length ? (
          <ul className="space-y-2">
            {analysis.signals.map((s) => (
              <li key={s.id} className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-xs">
                <div className="font-semibold text-amber-700 dark:text-amber-300">
                  {s.label} {s.line && <span className="font-mono font-normal text-slate-500">· line {s.line}</span>}
                </div>
                <p className="mt-1 text-slate-600 dark:text-slate-300">{s.detail}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-500">Bound conventions look internally consistent.</p>
        )}
      </div>
    </section>
  );
}

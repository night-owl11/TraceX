'use client';

import { CheckCircle2, EyeOff, XCircle } from 'lucide-react';
import { formatArgs } from '@/lib/primary';

export default function TestResults({ results, fnName }) {
  return (
    <ul className="space-y-2">
      {results.map((r, i) => (
        <li
          key={i}
          className={`rounded-xl border px-3 py-2 text-sm ${
            r.passed
              ? 'border-emerald-500/30 bg-emerald-500/5'
              : 'border-rose-500/40 bg-rose-500/5 shadow-[0_0_16px_rgba(244,63,94,0.12)]'
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            {r.passed ? <CheckCircle2 size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-rose-500" />}
            <span className="font-medium">{r.name}</span>
            {r.hidden && (
              <span className="chip border-slate-300 text-slate-500 dark:border-white/15 dark:text-slate-400">
                <EyeOff size={11} /> hidden · {r.category}
              </span>
            )}
          </div>
          {!r.hidden && !r.passed && (
            <div className="mt-1 break-all font-mono text-xs text-slate-600 dark:text-slate-300">
              {fnName}({formatArgs(r.args)}) → <b className="text-rose-600 dark:text-rose-300">{r.error || r.actual}</b>
              <span className="text-slate-500"> · expected {r.expected}</span>
            </div>
          )}
          {r.hidden && !r.passed && (
            <div className="mt-1 text-xs text-rose-600 dark:text-rose-300">
              {r.error || `Fails on a “${r.category}” case — input kept hidden on purpose.`}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

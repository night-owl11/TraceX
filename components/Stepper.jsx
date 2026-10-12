'use client';

import { Check, Code2, Microscope, Swords, ShieldCheck } from 'lucide-react';

const STEPS = [
  { n: 1, label: 'Playground', sub: 'Run & trace', icon: Code2 },
  { n: 2, label: 'Diagnosis', sub: 'Evidence-backed', icon: Microscope },
  { n: 3, label: 'Challenge', sub: 'Targeted drill', icon: Swords },
  { n: 4, label: 'Verification', sub: 'Fresh problem', icon: ShieldCheck },
];

export default function Stepper({ step, maxStep, onSelect }) {
  return (
    <ol className="glass flex items-stretch gap-1 p-1.5">
      {STEPS.map(({ n, label, sub, icon: Icon }) => {
        const active = n === step;
        const done = n < maxStep || (n < step);
        const reachable = n <= maxStep;
        return (
          <li key={n} className="min-w-0 flex-1">
            <button
              disabled={!reachable}
              onClick={() => onSelect(n)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-all duration-300 disabled:cursor-not-allowed ${
                active
                  ? 'bg-gradient-to-r from-blue-500/15 to-violet-500/15 shadow-[0_0_18px_rgba(59,130,246,0.35)] ring-1 ring-cyan-400/40'
                  : reachable
                    ? 'hover:bg-slate-900/5 dark:hover:bg-white/5'
                    : 'opacity-45'
              }`}
            >
              <span
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold ${
                  active
                    ? 'bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-glow-blue'
                    : done
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                      : 'bg-slate-200/80 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                }`}
              >
                {done && !active ? <Check size={15} /> : <Icon size={15} />}
              </span>
              <span className="hidden min-w-0 sm:block">
                <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {n}. {label}
                </span>
                <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">{sub}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

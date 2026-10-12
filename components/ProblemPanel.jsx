import { BookOpen } from 'lucide-react';
import RichText from '@/components/RichText';

export default function ProblemPanel({ problem }) {
  return (
    <section className="glass flex h-full flex-col gap-5 p-6 animate-fade-up">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="label mb-1 flex items-center gap-1.5">
            <BookOpen size={12} /> Problem
          </p>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{problem.title}</h2>
        </div>
        <span className="chip border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">{problem.difficulty}</span>
      </header>

      <RichText text={problem.prompt} className="leading-relaxed text-slate-700 dark:text-slate-300" />

      <div>
        <p className="label mb-2">Constraints</p>
        <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
          {problem.constraints.map((c) => (
            <li key={c} className="flex gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-cyan-500" />
              {c}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="label mb-2">Examples</p>
        <div className="space-y-2">
          {problem.examples.map((e) => (
            <div key={e.input} className="rounded-xl border border-slate-200 bg-slate-900/[0.03] px-3 py-2 font-mono text-xs dark:border-white/10 dark:bg-black/30">
              <div className="text-slate-700 dark:text-slate-200">{e.input}</div>
              <div className="text-cyan-700 dark:text-cyan-300">→ {e.output}</div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-auto rounded-xl border border-violet-400/30 bg-violet-500/5 p-3 text-xs text-slate-600 dark:text-slate-300">
        This starter code has a bug. Run it — TraceX will capture the execution evidence and work out <em>why</em> your mental model went wrong, instead of handing you the fix.
      </p>
    </section>
  );
}

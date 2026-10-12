import { AlertTriangle, Award, CheckCircle2, RotateCcw } from 'lucide-react';
import GlowButton from '@/components/GlowButton';

export default function MasteryReport({ diagnosis, challengeResult, freshResult, onRetry, onRestart }) {
  const mastered = freshResult.mastered;
  const conceptFlag = freshResult.allPassed && !freshResult.conceptual.ok;
  return (
    <section
      className={`glass border p-6 animate-fade-up ${mastered ? 'border-emerald-400/50 shadow-glow-green' : 'border-amber-400/40'}`}
    >
      <div className="flex flex-wrap items-center gap-4">
        <span className={`grid h-14 w-14 place-items-center rounded-2xl ${mastered ? 'bg-emerald-500/15 text-emerald-500 shadow-glow-green' : 'bg-amber-500/15 text-amber-500'}`}>
          {mastered ? <Award size={28} /> : <AlertTriangle size={28} />}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            {mastered ? 'Mastery verified' : conceptFlag ? 'Tests pass — but the old pattern is still in your code' : 'Not there yet'}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {mastered
              ? `You solved an unseen problem without repeating the "${diagnosis.title}" pattern.`
              : conceptFlag
                ? 'Your answers are right, but the static check still sees mismatched interval conventions. Make bounds, loop condition and updates agree, then resubmit.'
                : `Fresh problem: ${freshResult.passed}/${freshResult.total} hidden tests passed. Re-read the concept primer and try again.`}
          </p>
        </div>
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          ['Misconception found', diagnosis.title, true],
          ['Targeted challenge', challengeResult ? `${challengeResult.passed}/${challengeResult.total} tests` : 'skipped', !!challengeResult?.allPassed],
          ['Fresh independent test', `${freshResult.passed}/${freshResult.total} hidden tests`, mastered],
        ].map(([k, v, ok]) => (
          <li key={k} className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
            <p className="label mb-1 flex items-center gap-1.5">
              <CheckCircle2 size={12} className={ok ? 'text-emerald-500' : 'text-slate-400'} /> {k}
            </p>
            <p className="text-sm font-medium">{v}</p>
          </li>
        ))}
      </ul>

      {freshResult.conceptual.signals.length > 0 && (
        <ul className="mt-4 space-y-2">
          {freshResult.conceptual.signals.map((s) => (
            <li key={s.id} className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 text-xs text-slate-600 dark:text-slate-300">
              <b className="text-amber-700 dark:text-amber-300">{s.label}</b> — {s.detail}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        {!mastered && <GlowButton variant="ghost" onClick={onRetry}>Keep trying</GlowButton>}
        <GlowButton variant={mastered ? 'success' : 'ghost'} icon={RotateCcw} onClick={onRestart}>Start a new case</GlowButton>
      </div>
    </section>
  );
}

import { Brain, HelpCircle, Lightbulb, Microscope, Sparkles, Cpu } from 'lucide-react';

const KIND = {
  test: 'border-rose-500/40 text-rose-600 dark:text-rose-300',
  trace: 'border-cyan-500/40 text-cyan-700 dark:text-cyan-300',
  static: 'border-amber-500/40 text-amber-700 dark:text-amber-300',
  stderr: 'border-red-500/40 text-red-600 dark:text-red-300',
};

export default function DiagnosisCard({ diagnosis }) {
  const none = diagnosis.misconceptionId === 'NONE';
  const pct = Math.round((diagnosis.confidence || 0) * 100);
  return (
    <section className="glass glow-border flex flex-col gap-5 border p-5 animate-fade-up">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="label mb-1 flex items-center gap-1.5">
            <Microscope size={12} /> Misconception diagnosis
          </p>
          <h3 className="text-lg font-bold leading-snug text-slate-900 dark:text-white">{diagnosis.title}</h3>
        </div>
        <span className="chip border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300">
          {diagnosis.source === 'gemini' ? <Sparkles size={11} /> : <Cpu size={11} />}
          {diagnosis.source === 'gemini' ? 'Gemini' : 'Local engine'}
        </span>
      </header>

      <div>
        <div className="mb-1 flex justify-between text-[11px] text-slate-500">
          <span>Confidence</span>
          <span className="font-mono">{pct}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-500 shadow-glow-cyan" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className={`rounded-xl border p-4 ${none ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-violet-500/30 bg-violet-500/5'}`}>
        <p className="label mb-1.5 flex items-center gap-1.5"><Brain size={12} /> Your mental model</p>
        <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-100">{diagnosis.mentalModelFlaw}</p>
      </div>

      <div>
        <p className="label mb-1.5">Why it breaks</p>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{diagnosis.whyItBreaks}</p>
      </div>

      <div>
        <p className="label mb-2">Evidence</p>
        <ul className="space-y-2">
          {diagnosis.evidence.map((e, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-600 dark:text-slate-300">
              <span className={`chip h-fit shrink-0 uppercase ${KIND[e.kind] || 'border-slate-300'}`}>{e.kind}</span>
              <span>{e.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="label mb-2 flex items-center gap-1.5"><HelpCircle size={12} /> Ask yourself</p>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-700 marker:text-cyan-500 dark:text-slate-200">
          {diagnosis.socraticQuestions.map((q, i) => <li key={i}>{q}</li>)}
        </ol>
      </div>

      <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
        <p className="label mb-1.5 flex items-center gap-1.5"><Lightbulb size={12} /> Concept primer</p>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{diagnosis.conceptPrimer}</p>
      </div>
    </section>
  );
}

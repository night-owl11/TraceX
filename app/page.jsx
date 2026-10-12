'use client';

import { useState } from 'react';
import { AlertCircle, ArrowLeft, FastForward, Play, ScanSearch, ShieldCheck, Swords, X } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import Stepper from '@/components/Stepper';
import GlowButton from '@/components/GlowButton';
import CodeEditor from '@/components/CodeEditor';
import ProblemPanel from '@/components/ProblemPanel';
import TracePanel from '@/components/TracePanel';
import DiagnosisCard from '@/components/DiagnosisCard';
import ProblemWorkspace from '@/components/ProblemWorkspace';
import MasteryReport from '@/components/MasteryReport';
import { PRIMARY } from '@/lib/primary';

async function post(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

export default function Page() {
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [code, setCode] = useState(PRIMARY.starterCode);
  const [evidence, setEvidence] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [challengeCode, setChallengeCode] = useState('');
  const [challengeResult, setChallengeResult] = useState(null);
  const [fresh, setFresh] = useState(null);
  const [freshCode, setFreshCode] = useState('');
  const [freshResult, setFreshResult] = useState(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  const advance = (n) => {
    setStep(n);
    setMaxStep((m) => Math.max(m, n));
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const withBusy = async (name, fn) => {
    setBusy(name);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e.message || 'Something went wrong');
    } finally {
      setBusy(null);
    }
  };

  // Step 1 → 2
  const runAnalysis = () =>
    withBusy('run', async () => {
      const [ev, dg] = await Promise.all([post('/api/run', { code }), post('/api/diagnose', { code })]);
      setEvidence(ev);
      setDiagnosis(dg.diagnosis);
      setChallenge(null);
      setChallengeResult(null);
      setFresh(null);
      setFreshResult(null);
      setMaxStep(2);
      advance(2);
    });

  // Step 2 → 3
  const startChallenge = () =>
    withBusy('challenge', async () => {
      if (!challenge) {
        const { problem } = await post('/api/challenge', { kind: 'challenge', misconceptionId: diagnosis.misconceptionId });
        setChallenge(problem);
        setChallengeCode(problem.starterCode);
        setChallengeResult(null);
      }
      advance(3);
    });

  const checkChallenge = () =>
    withBusy('checkChallenge', async () => {
      setChallengeResult(await post('/api/check', { token: challenge.token, code: challengeCode }));
    });

  // Step 3 → 4
  const startFresh = () =>
    withBusy('fresh', async () => {
      if (!fresh) {
        const { problem } = await post('/api/challenge', {
          kind: 'fresh',
          misconceptionId: diagnosis.misconceptionId,
          excludeId: PRIMARY.id,
          excludeTitle: PRIMARY.title,
        });
        setFresh(problem);
        setFreshCode(problem.starterCode);
        setFreshResult(null);
      }
      advance(4);
    });

  const checkFresh = () =>
    withBusy('checkFresh', async () => {
      setFreshResult(await post('/api/check', { token: fresh.token, code: freshCode }));
    });

  const restart = () => {
    setStep(1);
    setMaxStep(1);
    setCode(PRIMARY.starterCode);
    setEvidence(null);
    setDiagnosis(null);
    setChallenge(null);
    setChallengeResult(null);
    setFresh(null);
    setFreshResult(null);
    setError(null);
  };

  const noMisconception = diagnosis?.misconceptionId === 'NONE';

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ambient glow orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-24 h-96 w-96 animate-drift rounded-full bg-blue-400/25 blur-3xl dark:bg-blue-600/20" />
        <div className="absolute -right-24 top-40 h-96 w-96 animate-drift rounded-full bg-violet-400/25 blur-3xl [animation-delay:-6s] dark:bg-violet-600/20" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 animate-drift rounded-full bg-cyan-300/20 blur-3xl [animation-delay:-3s] dark:bg-cyan-500/10" />
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-500 via-cyan-500 to-violet-500 text-white shadow-glow-blue">
              <ScanSearch size={22} />
            </span>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Trace<span className="bg-gradient-to-r from-cyan-500 to-violet-500 bg-clip-text text-transparent">X</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">The Misconception Detective</p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <Stepper step={step} maxStep={maxStep} onSelect={(n) => n <= maxStep && setStep(n)} />

        {error && (
          <div role="alert" className="flex items-start gap-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-700 shadow-glow-rose dark:text-rose-200">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} aria-label="Dismiss"><X size={16} /></button>
          </div>
        )}

        {/* ───────── Step 1 ───────── */}
        {step === 1 && (
          <div className="grid gap-5 lg:grid-cols-2">
            <ProblemPanel problem={PRIMARY} />
            <div className="flex flex-col gap-4 animate-fade-up">
              <CodeEditor value={code} onChange={setCode} onRun={runAnalysis} height="460px" />
              <div className="flex flex-wrap items-center gap-3">
                <GlowButton icon={Play} loading={busy === 'run'} onClick={runAnalysis}>
                  Run &amp; Analyze Trace
                </GlowButton>
                <GlowButton variant="ghost" onClick={() => setCode(PRIMARY.starterCode)}>Reset code</GlowButton>
                <span className="text-[11px] text-slate-500">Ctrl/⌘ + Enter</span>
              </div>
            </div>
          </div>
        )}

        {/* ───────── Step 2 ───────── */}
        {step === 2 && evidence && diagnosis && (
          <>
            <div className="grid items-start gap-5 lg:grid-cols-2">
              <TracePanel evidence={evidence} />
              <DiagnosisCard diagnosis={diagnosis} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <GlowButton variant="ghost" icon={ArrowLeft} onClick={() => setStep(1)}>Back to editor</GlowButton>
              <GlowButton variant="violet" icon={Swords} loading={busy === 'challenge'} onClick={startChallenge}>
                Solve Challenge
              </GlowButton>
              {noMisconception && (
                <GlowButton variant="ghost" icon={FastForward} loading={busy === 'fresh'} onClick={startFresh}>
                  Skip to fresh test
                </GlowButton>
              )}
            </div>
          </>
        )}

        {/* ───────── Step 3 ───────── */}
        {step === 3 && challenge && (
          <ProblemWorkspace
            kicker="Step 3 · Targeted diagnostic challenge"
            problem={challenge}
            code={challengeCode}
            setCode={setChallengeCode}
            onSubmit={checkChallenge}
            busy={busy === 'checkChallenge'}
            submitLabel="Solve Challenge"
            result={challengeResult}
            extraActions={
              <>
                <GlowButton variant="ghost" icon={ArrowLeft} onClick={() => setStep(2)}>Diagnosis</GlowButton>
                <GlowButton
                  variant="success"
                  icon={ShieldCheck}
                  disabled={!challengeResult?.allPassed}
                  loading={busy === 'fresh'}
                  onClick={startFresh}
                >
                  Verify Mastery
                </GlowButton>
              </>
            }
          />
        )}

        {/* ───────── Step 4 ───────── */}
        {step === 4 && fresh && (
          <div className="space-y-5">
            <ProblemWorkspace
              kicker="Step 4 · Independent fresh test"
              problem={fresh}
              code={freshCode}
              setCode={setFreshCode}
              onSubmit={checkFresh}
              busy={busy === 'checkFresh'}
              submitLabel="Verify Mastery"
              submitVariant="success"
              result={freshResult}
              extraActions={
                <GlowButton variant="ghost" icon={ArrowLeft} onClick={() => setStep(challenge ? 3 : 2)}>Back</GlowButton>
              }
            />
            {freshResult && (
              <MasteryReport
                diagnosis={diagnosis}
                challengeResult={challengeResult}
                freshResult={freshResult}
                onRetry={() => setFreshResult(null)}
                onRestart={restart}
              />
            )}
          </div>
        )}

        <footer className="pb-6 pt-2 text-center text-[11px] text-slate-500">
          TraceX · evidence first, answers last.
        </footer>
      </div>
    </div>
  );
}

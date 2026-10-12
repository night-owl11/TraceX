# TraceX — The Misconception Detective

An AI coding tutor that goes beyond error messages. It **captures execution evidence**, **diagnoses the conceptual misconception**
behind a bug, serves a **targeted diagnostic challenge**, then **verifies mastery on a fresh, unseen problem** with hidden tests.

```
Step 1  Playground      Buggy binary search + Monaco editor → "Run & Analyze Trace"
Step 2  Diagnosis       Real test runs, array-read + variable-mutation traces, stderr, static insights,
                        and a structured misconception card (Gemini JSON schema, or the local engine)
Step 3  Challenge       Small generated drill that isolates the misconception
Step 4  Verification    Fresh problem, hidden tests, plus a conceptual re-check of the student's code
```

## Quick start

```bash
npm install
cp .env.example .env.local        # optional: add GEMINI_API_KEY
npm run test:sandbox              # sanity-check the sandbox + problem bank (no browser needed)
npm run dev                       # http://localhost:3000
```

Without `GEMINI_API_KEY` everything still works: diagnosis comes from the built-in local engine and problems from the curated bank.
With a key, Gemini produces the diagnosis (structured JSON via `responseSchema`) and can generate challenge / fresh problems —
each generated problem is **validated in the sandbox** (its reference solution must pass its own tests; challenge starters must actually fail)
and silently falls back to the bank otherwise.

## Folder structure

```
tracex/
├─ app/
│  ├─ layout.jsx            # theme bootstrap script (no flash), metadata
│  ├─ page.jsx              # 4-step state machine
│  ├─ globals.css           # glass / glow utilities
│  └─ api/
│     ├─ run/route.js       # POST {code}            → execution trace + static analysis
│     ├─ diagnose/route.js  # POST {code}            → misconception diagnosis (Gemini | local)
│     ├─ challenge/route.js # POST {kind,…}          → challenge or fresh problem (+ sealed token)
│     └─ check/route.js     # POST {token, code}     → graded results (hidden tests stay server-side)
├─ components/              # ThemeToggle, GlowButton, Stepper, CodeEditor (Monaco), TracePanel,
│                           # DiagnosisCard, ProblemPanel, ProblemWorkspace, TestResults, MasteryReport
├─ lib/
│  ├─ sandbox.js            # node:vm runner: timeout, Proxy array-read tracing, variable instrumentation
│  ├─ analysis.js           # static "AST-style" interval-convention analysis
│  ├─ diagnose.js           # Gemini call + local diagnosis engine
│  ├─ problems.js           # Gemini problem generation + validation, bank fallback
│  ├─ bank.js               # curated challenges / fresh problems (server only)
│  ├─ gemini.js             # REST client with structured JSON output
│  ├─ seal.js               # AES-256-GCM sealed tokens (stateless → Vercel friendly)
│  ├─ misconceptions.js     # taxonomy
│  ├─ primary.js            # Step-1 problem
│  └─ evidence.js
├─ scripts/selftest.mjs
├─ tailwind.config.js       # glow shadows + animations
└─ .env.example
```

## Deploy to Vercel

1. Push to GitHub, import the repo in Vercel (framework: Next.js, zero config).
2. Set env vars: `GEMINI_API_KEY`, optionally `GEMINI_MODEL`, and a long random `SESSION_SECRET`.
3. Deploy. All API routes run on the Node.js runtime (`maxDuration` is set per route).

## Production hardening (read this)

`node:vm` is **not** a security boundary. It is fine for a prototype and demo, but for real untrusted traffic replace
`runInSandbox` in `lib/sandbox.js` with a call to an isolated runtime — e.g. a **Cloud Run job / gVisor / Firecracker** worker,
`isolated-vm`, or Judge0 — keeping the same return shape. Also add rate limiting on `/api/*`.

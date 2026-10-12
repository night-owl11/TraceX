'use client';

import { Loader2 } from 'lucide-react';

// Full class strings (not interpolated) so Tailwind can see them.
const VARIANTS = {
  primary:
    'text-white bg-gradient-to-r from-blue-500 via-cyan-500 to-violet-500 border border-white/30 shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_34px_rgba(139,92,246,0.75)] hover:-translate-y-0.5 animate-glow-pulse',
  violet:
    'text-white bg-gradient-to-r from-violet-600 via-fuchsia-500 to-blue-500 border border-white/30 shadow-[0_0_22px_rgba(139,92,246,0.55)] hover:shadow-[0_0_36px_rgba(217,70,239,0.7)] hover:-translate-y-0.5',
  success:
    'text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 border border-white/30 shadow-[0_0_22px_rgba(16,185,129,0.55)] hover:shadow-[0_0_36px_rgba(34,211,238,0.7)] hover:-translate-y-0.5 animate-glow-pulse-green',
  ghost:
    'text-slate-700 dark:text-slate-200 bg-white/60 dark:bg-white/5 border border-slate-300/80 dark:border-white/15 hover:border-cyan-400/60 hover:shadow-[0_0_18px_rgba(34,211,238,0.35)]',
};

export default function GlowButton({ children, icon: Icon, variant = 'primary', loading = false, disabled = false, className = '', ...rest }) {
  const off = disabled || loading;
  return (
    <button
      disabled={off}
      className={`relative inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold tracking-wide transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:animate-none disabled:hover:translate-y-0 ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}

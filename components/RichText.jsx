// Tiny inline renderer for `code`, **bold** and *italic* in problem prompts.
export default function RichText({ text, className = '' }) {
  const parts = String(text || '').split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <p className={className}>
      {parts.map((p, i) => {
        if (p.startsWith('`') && p.endsWith('`'))
          return (
            <code key={i} className="rounded bg-slate-900/5 px-1.5 py-0.5 font-mono text-[0.85em] text-violet-700 dark:bg-white/10 dark:text-cyan-200">
              {p.slice(1, -1)}
            </code>
          );
        if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
        if (p.startsWith('*') && p.endsWith('*') && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>;
        return <span key={i}>{p}</span>;
      })}
    </p>
  );
}

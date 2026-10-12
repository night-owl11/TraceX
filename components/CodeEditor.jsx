'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';

const Monaco = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-sm text-slate-500">Loading editor…</div>,
});

export default function CodeEditor({ value, onChange, onRun, height = '420px', readOnly = false }) {
  const [dark, setDark] = useState(true);
  const runRef = useRef(onRun);
  runRef.current = onRun;

  // Keep Monaco's theme in sync with the Tailwind `dark` class.
  useEffect(() => {
    const el = document.documentElement;
    const sync = () => setDark(el.classList.contains('dark'));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(el, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, []);

  return (
    <div
      className="glow-border overflow-hidden rounded-xl border bg-white/80 dark:bg-[#0b1020]/80"
      style={{ height }}
    >
      <Monaco
        height="100%"
        language="javascript"
        theme={dark ? 'vs-dark' : 'light'}
        value={value}
        onChange={(v) => onChange(v ?? '')}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineHeight: 22,
          scrollBeyondLastLine: false,
          padding: { top: 12, bottom: 12 },
          automaticLayout: true,
          tabSize: 2,
          readOnly,
          renderLineHighlight: 'gutter',
          fontLigatures: true,
        }}
        onMount={(editor, monaco) => {
          editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => runRef.current && runRef.current());
        }}
      />
    </div>
  );
}

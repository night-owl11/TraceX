/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Inter', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'JetBrains Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(59,130,246,0.5)',
        'glow-cyan': '0 0 20px rgba(34,211,238,0.5)',
        'glow-violet': '0 0 28px rgba(139,92,246,0.65)',
        'glow-green': '0 0 22px rgba(16,185,129,0.55)',
        'glow-rose': '0 0 22px rgba(244,63,94,0.45)',
        'card-light': '0 8px 30px rgba(15,23,42,0.06)',
      },
      keyframes: {
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 14px rgba(59,130,246,0.45)' },
          '50%': { boxShadow: '0 0 28px rgba(139,92,246,0.7)' },
        },
        glowPulseGreen: {
          '0%, 100%': { boxShadow: '0 0 14px rgba(16,185,129,0.45)' },
          '50%': { boxShadow: '0 0 28px rgba(34,211,238,0.7)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(30px,-20px,0) scale(1.08)' },
        },
        scan: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
      },
      animation: {
        'glow-pulse': 'glowPulse 2.8s ease-in-out infinite',
        'glow-pulse-green': 'glowPulseGreen 2.8s ease-in-out infinite',
        'fade-up': 'fadeUp 0.45s ease-out both',
        drift: 'drift 14s ease-in-out infinite',
        scan: 'scan 2.4s linear infinite',
      },
    },
  },
  plugins: [],
};

import './globals.css';

export const metadata = {
  title: 'TraceX — The Misconception Detective',
  description:
    'An AI coding tutor that captures execution evidence, diagnoses the misconception behind your bug, and verifies mastery with a fresh problem.',
};

// Runs before first paint so there is no light/dark flash.
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem('tracex-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = stored ? stored === 'dark' : prefersDark;
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

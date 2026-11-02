import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          '"Fira Code"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
        serif: [
          '"Computer Modern"',
          '"Latin Modern Roman"',
          '"STIX Two Text"',
          'Georgia',
          'Cambria',
          '"Times New Roman"',
          'serif',
        ],
      },
      colors: {
        cortex: {
          bg: 'var(--cortex-bg)',
          surface: 'var(--cortex-surface)',
          panel: 'var(--cortex-panel)',
          border: 'var(--cortex-border)',
          text: 'var(--cortex-text)',
          muted: 'var(--cortex-muted)',
          brand: '#1e3a6e',
          brandHover: '#162d57',
          brandAccent: '#3564b3',
          brandTint: '#edf3fc',
          cyan: '#7ed6ff',
        },
      },
    },
  },
  plugins: [],
};

export default config;

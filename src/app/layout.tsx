import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CorTeX by Corca — Academic Research & Writing Workspace',
  description:
    'Built for scholars, designed for research. Multi-format LaTeX, Typst, Markdown, and Slide authoring with integrated research library and Orca AI assistant.',
  icons: {
    icon: '/cortex-symbol-rect.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;1,400&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400&family=Public+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#fcfcf9] text-[#1c1c1a] antialiased">
        {children}
      </body>
    </html>
  );
}

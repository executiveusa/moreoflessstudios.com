import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'More-of-Less Studio',
  description: 'Your personal AI studio for music, visuals, and creative expression.',
  openGraph: {
    title: 'More-of-Less Studio',
    description: 'AI-powered music & video creation studio',
    siteName: 'More-of-Less',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'AIRI — Is Your Business Visible to AI?',
    template: '%s | AIRI',
  },
  description:
    'Check if AI search engines like ChatGPT, Perplexity, and Gemini can find and recommend your business. Get a free AI Visibility Score in 30 seconds.',
  openGraph: {
    title: 'AIRI — AI Visibility Score for Your Business',
    description:
      'Find out if AI recommends your business. Free scan, instant results.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}

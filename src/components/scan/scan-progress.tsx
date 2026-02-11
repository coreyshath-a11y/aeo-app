'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const PROGRESS_MESSAGES = [
  'Connecting to your website...',
  'Reading your page content...',
  'Checking your schema markup...',
  'Looking for your business details...',
  'Verifying your address...',
  'Checking your sitemap...',
  'Analyzing your security...',
  'Measuring page speed...',
  'Checking if AI bots can read your site...',
  'Reviewing your FAQ coverage...',
  'Looking for pricing information...',
  'Checking content freshness...',
  'Calculating your AI visibility score...',
  'Generating your recommendations...',
  'Almost done...',
];

export function ScanProgress() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) =>
        prev < PROGRESS_MESSAGES.length - 1 ? prev + 1 : prev
      );
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <div className="text-center">
        <h2 className="text-xl font-semibold">Scanning Your Website</h2>
        <p className="mt-2 text-sm text-muted-foreground transition-all duration-300">
          {PROGRESS_MESSAGES[messageIndex]}
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        This usually takes 15-30 seconds
      </p>
    </div>
  );
}

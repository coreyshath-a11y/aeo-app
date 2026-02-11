'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, Suspense } from 'react';
import { ScanProgress } from '@/components/scan/scan-progress';
import { useScanPolling } from '@/hooks/use-scan-polling';
import { AlertCircle } from 'lucide-react';

function ScanNewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const scanId = searchParams.get('id');
  const { status, error } = useScanPolling(scanId);

  useEffect(() => {
    if (status === 'completed' && scanId) {
      router.push(`/scan/${scanId}`);
    }
  }, [status, scanId, router]);

  if (!scanId) {
    return (
      <div className="flex flex-col items-center py-20">
        <p className="text-muted-foreground">No scan ID provided.</p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Scan Failed</h2>
        <p className="max-w-md text-center text-sm text-muted-foreground">
          {error || 'Something went wrong while scanning your website.'}
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 text-sm text-primary underline-offset-4 hover:underline"
        >
          Try again with a different URL
        </button>
      </div>
    );
  }

  return <ScanProgress />;
}

export default function ScanNewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <ScanProgress />
        </div>
      }
    >
      <ScanNewContent />
    </Suspense>
  );
}

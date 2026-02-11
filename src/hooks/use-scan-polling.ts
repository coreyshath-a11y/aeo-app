'use client';

import { useState, useEffect, useCallback } from 'react';

type ScanStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface ScanPollResult {
  status: ScanStatus;
  data: Record<string, unknown> | null;
  error: string | null;
}

export function useScanPolling(scanId: string | null): ScanPollResult {
  const [status, setStatus] = useState<ScanStatus>('pending');
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const poll = useCallback(async () => {
    if (!scanId) return;

    try {
      const res = await fetch(`/api/scan/${scanId}`);
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Failed to check scan status');
        setStatus('failed');
        return true; // Stop polling
      }

      setStatus(json.status);

      if (json.status === 'completed') {
        setData(json);
        return true; // Stop polling
      }

      if (json.status === 'failed') {
        setError(json.error || 'Scan failed');
        return true; // Stop polling
      }

      return false; // Continue polling
    } catch {
      setError('Could not connect to our servers');
      return false; // Retry
    }
  }, [scanId]);

  useEffect(() => {
    if (!scanId) return;

    let cancelled = false;

    const startPolling = async () => {
      // Initial check
      const done = await poll();
      if (done || cancelled) return;

      // Poll every 2 seconds
      const interval = setInterval(async () => {
        const done = await poll();
        if (done || cancelled) {
          clearInterval(interval);
        }
      }, 2000);

      return () => clearInterval(interval);
    };

    let cleanup: (() => void) | undefined;
    startPolling().then((fn) => {
      cleanup = fn;
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [scanId, poll]);

  return { status, data, error };
}

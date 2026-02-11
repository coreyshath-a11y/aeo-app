'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function UrlInputForm({ size = 'large' }: { size?: 'large' | 'small' }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter your website URL');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }

      if (data.cached) {
        router.push(`/scan/${data.scanId}`);
      } else {
        router.push(`/scan/new?id=${data.scanId}`);
      }
    } catch {
      setError('Could not connect to our servers. Please try again.');
      setLoading(false);
    }
  }

  const isLarge = size === 'large';

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl">
      <div className={`flex gap-2 ${isLarge ? 'flex-col sm:flex-row' : 'flex-row'}`}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter your website URL (e.g. mybusiness.com)"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError('');
            }}
            className={`pl-9 ${isLarge ? 'h-12 text-base' : 'h-10'}`}
            disabled={loading}
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className={isLarge ? 'h-12 px-8 text-base' : 'h-10 px-6'}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : (
            'Scan My Site'
          )}
        </Button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </form>
  );
}

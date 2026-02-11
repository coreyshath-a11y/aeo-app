'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { OAuthButtons } from './oauth-buttons';
import { RefreshCw } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resending, setResending] = useState(false);

  // Check for OAuth callback errors
  const authError = searchParams.get('error');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setEmailNotConfirmed(false);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        const msg = signInError.message.toLowerCase();

        // Detect unconfirmed email
        if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
          setEmailNotConfirmed(true);
          setError('Your email has not been confirmed yet. Check your inbox for the confirmation link.');
          return;
        }

        // Detect invalid credentials
        if (msg.includes('invalid') || msg.includes('credentials')) {
          setError('Invalid email or password. Please try again.');
          return;
        }

        setError(signInError.message);
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendConfirmation() {
    if (!email) {
      setError('Enter your email address first.');
      return;
    }

    setResending(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(redirectTo)}`,
        },
      });

      if (resendError) {
        setError(resendError.message);
      } else {
        setError(null);
        setEmailNotConfirmed(true);
      }
    } catch {
      setError('Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  }

  async function handleForgotPassword() {
    if (!email) {
      setError('Enter your email address first, then click "Forgot password?"');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${window.location.origin}/dashboard/settings` }
      );

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setResetSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (resetSent) {
    return (
      <div className="w-full space-y-4 text-center">
        <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-4">
          <p className="text-sm font-medium">Check your email</p>
          <p className="mt-1 text-sm text-muted-foreground">
            We sent a password reset link to <strong>{email}</strong>
          </p>
        </div>
        <button
          onClick={() => setResetSent(false)}
          className="text-sm text-primary hover:text-primary/80"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5">
      {/* OAuth callback error */}
      {authError && !error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Sign in failed. Please try again.
        </div>
      )}

      {/* OAuth providers first — fastest path */}
      <OAuthButtons />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-3 text-muted-foreground">
            or sign in with email
          </span>
        </div>
      </div>

      {/* Email/password form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Resend confirmation button (shown when email not confirmed) */}
        {emailNotConfirmed && (
          <button
            type="button"
            onClick={handleResendConfirmation}
            disabled={resending}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${resending ? 'animate-spin' : ''}`} />
            {resending ? 'Sending...' : 'Resend confirmation email'}
          </button>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              Forgot password?
            </button>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Your password"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

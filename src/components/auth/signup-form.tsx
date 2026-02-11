'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { OAuthButtons } from './oauth-buttons';
import { Mail, RefreshCw } from 'lucide-react';

export function SignupForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!acceptedTerms) {
      setError('You must accept the Terms and Conditions to create an account.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(redirectTo)}`,
          data: {
            full_name: fullName,
            company_name: companyName,
            accepted_terms: acceptedTerms,
            marketing_consent: marketingConsent,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // If session exists, email confirmation is disabled — go straight to dashboard
      if (data.session) {
        window.location.href = redirectTo;
        return;
      }

      // No session = email confirmation required — show the confirmation screen
      setConfirmationSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendConfirmation() {
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
      }
    } catch {
      setError('Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  }

  // ── Confirmation Screen ──────────────────────────────
  if (confirmationSent) {
    return (
      <div className="w-full space-y-5 text-center">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-7 w-7 text-primary" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold">Check your email</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a confirmation link to
          </p>
          <p className="mt-1 font-medium">{email}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Click the link in the email to activate your account and get your
            full AI visibility report.
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="space-y-3 pt-2">
          <button
            onClick={handleResendConfirmation}
            disabled={resending}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${resending ? 'animate-spin' : ''}`} />
            {resending ? 'Sending...' : "Didn't get it? Resend email"}
          </button>
          <p className="text-xs text-muted-foreground">
            Check your spam folder too. The email comes from noreply@mail.app.supabase.io
          </p>
        </div>
      </div>
    );
  }

  // ── Signup Form ──────────────────────────────────────
  return (
    <div className="w-full space-y-5">
      {/* OAuth providers first — fastest path */}
      <OAuthButtons />

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-3 text-muted-foreground">
            or sign up with email
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

        <div>
          <label htmlFor="fullName" className="block text-sm font-medium">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Jane Smith"
            required
          />
        </div>

        <div>
          <label htmlFor="companyName" className="block text-sm font-medium">
            Company Name
          </label>
          <input
            id="companyName"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Smith's Coffee Shop"
          />
        </div>

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
          <label htmlFor="password" className="block text-sm font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="At least 8 characters"
            minLength={8}
            required
          />
        </div>

        <div className="space-y-3 pt-2">
          <label className="flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm text-muted-foreground">
              I agree to the{' '}
              <a href="/terms" className="text-primary underline hover:text-primary/80">
                Terms and Conditions
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-primary underline hover:text-primary/80">
                Privacy Policy
              </a>
            </span>
          </label>

          <label className="flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm text-muted-foreground">
              Send me tips on improving my AI visibility (you can unsubscribe anytime)
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Creating account...' : 'Create Free Account'}
        </button>
      </form>

      <p className="text-center text-xs text-muted-foreground">
        By signing up with Google or Apple, you agree to our{' '}
        <a href="/terms" className="text-primary underline hover:text-primary/80">
          Terms
        </a>{' '}
        and{' '}
        <a href="/privacy" className="text-primary underline hover:text-primary/80">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}

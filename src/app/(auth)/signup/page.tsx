import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { SignupForm } from '@/components/auth/signup-form';

export const metadata: Metadata = {
  title: 'Create Account',
  description:
    'Create a free AIRI account to track your AI visibility score, get personalized recommendations, and monitor your progress over time.',
};

export default function SignupPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Create your free account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          See your full AI visibility report and track your score over time.
        </p>
      </div>

      <div className="mt-8 rounded-lg border border-border/60 bg-card p-6 shadow-sm">
        <Suspense fallback={<div className="h-96" />}>
          <SignupForm />
        </Suspense>
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:text-primary/80">
          Sign in
        </Link>
      </p>
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your AIRI account to view your dashboard and scan history.',
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to your account to continue.
        </p>
      </div>

      <div className="mt-8 rounded-lg border border-border/60 bg-card p-6 shadow-sm">
        <Suspense fallback={<div className="h-48" />}>
          <LoginForm />
        </Suspense>
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-primary hover:text-primary/80">
          Create one free
        </Link>
      </p>
    </div>
  );
}

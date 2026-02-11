import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { getDomain } from '@/lib/utils/url';
import { formatDistanceToNow } from 'date-fns';
import { Activity, ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { DashboardScanForm } from '@/components/dashboard/scan-form';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your AI visibility dashboard — scan history, scores, and recommendations.',
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const admin = createAdminClient();

  // Get profile
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, company_name, tier')
    .eq('id', user.id)
    .single();

  // Get scan history (most recent 10)
  const { data: scans } = await admin
    .from('scans')
    .select('id, url, total_score, grade, status, created_at, error_message')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const firstName = profile?.full_name?.split(' ')[0] || 'there';
  const latestCompletedScan = scans?.find((s) => s.status === 'completed');

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      {/* Welcome */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Hey {firstName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {latestCompletedScan
              ? `Your latest score: ${latestCompletedScan.total_score}/100 (${latestCompletedScan.grade})`
              : 'Run your first scan to see your AI visibility score.'}
          </p>
        </div>

        {profile?.tier === 'free' && (
          <Link
            href="/pricing"
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <TrendingUp className="h-4 w-4" />
            Upgrade Plan
          </Link>
        )}
      </div>

      {/* Scan Input */}
      <section className="mt-8 rounded-lg border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Scan a Website</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter a URL to check its AI visibility score.
        </p>
        <div className="mt-4">
          <DashboardScanForm />
        </div>
      </section>

      {/* Latest Score Card */}
      {latestCompletedScan && (
        <section className="mt-6 rounded-lg border border-border/60 bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <span className="text-lg font-bold text-primary">
                  {latestCompletedScan.grade}
                </span>
              </div>
              <div>
                <p className="font-semibold">
                  {getDomain(latestCompletedScan.url)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Score: {latestCompletedScan.total_score}/100
                </p>
              </div>
            </div>
            <Link
              href={`/scan/${latestCompletedScan.id}`}
              className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
            >
              View Report
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      {/* Scan History */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Scan History</h2>
        {!scans || scans.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-border/60 p-8 text-center">
            <Activity className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">
              No scans yet. Enter a URL above to get started.
            </p>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-border/40 rounded-lg border border-border/60 bg-card">
            {scans.map((scan) => (
              <div
                key={scan.id}
                className="flex items-center justify-between px-4 py-3 sm:px-6"
              >
                <div className="flex items-center gap-3">
                  {scan.status === 'completed' ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {scan.grade}
                    </div>
                  ) : scan.status === 'failed' ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10 text-xs font-medium text-destructive">
                      !!
                    </div>
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {getDomain(scan.url)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {scan.status === 'completed'
                        ? `${scan.total_score}/100`
                        : scan.status === 'failed'
                          ? 'Scan failed'
                          : 'Scanning...'}
                      {' · '}
                      {formatDistanceToNow(new Date(scan.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
                {scan.status === 'completed' && (
                  <Link
                    href={`/scan/${scan.id}`}
                    className="text-xs text-primary hover:text-primary/80"
                  >
                    View
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { SettingsForm } from '@/components/dashboard/settings-form';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your AIRI account settings.',
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');

  const tierLabels: Record<string, string> = {
    free: 'Free',
    monitor: 'Monitor ($8/mo)',
    diy: 'DIY ($29/mo)',
    pro: 'Pro ($99/mo)',
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your account and preferences.
      </p>

      {/* Profile */}
      <section className="mt-8 rounded-lg border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Profile</h2>
        <SettingsForm
          initialName={profile.full_name || ''}
          initialCompany={profile.company_name || ''}
          initialMarketing={profile.marketing_consent}
          email={user.email || ''}
        />
      </section>

      {/* Plan */}
      <section className="mt-6 rounded-lg border border-border/60 bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Plan</h2>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="font-medium">{tierLabels[profile.tier] || 'Free'}</p>
            <p className="text-sm text-muted-foreground">
              {profile.tier === 'free'
                ? '5 scans per day, limited recommendations'
                : 'Full access to all features'}
            </p>
          </div>
          {profile.tier === 'free' && (
            <a
              href="/pricing"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Upgrade
            </a>
          )}
        </div>
      </section>

      {/* Danger Zone */}
      <section className="mt-6 rounded-lg border border-destructive/20 bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Want to delete your account? Contact us at{' '}
          <a
            href="mailto:hello@airi.app"
            className="text-primary underline hover:text-primary/80"
          >
            hello@airi.app
          </a>{' '}
          and we&apos;ll handle it for you.
        </p>
      </section>
    </div>
  );
}

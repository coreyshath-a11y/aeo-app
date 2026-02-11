import type { Metadata } from 'next';
import { PILLAR_LABELS, PILLAR_DESCRIPTIONS, PILLAR_MAX_POINTS } from '@/lib/constants/scoring';
import type { PillarName } from '@/types/scan';
import {
  Fingerprint,
  Code2,
  RefreshCw,
  ShieldCheck,
  MessageCircleQuestion,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'How We Score',
  description:
    'Learn how AIRI measures your AI visibility across 5 key areas: Entity Verifiability, Schema Markup, Freshness, Trust Signals, and Answerability.',
};

const PILLAR_DETAILS: Record<
  PillarName,
  { icon: React.ReactNode; checks: string[] }
> = {
  entity_verifiability: {
    icon: <Fingerprint className="h-6 w-6" />,
    checks: [
      'Business schema markup (Organization or LocalBusiness)',
      'Business name in schema',
      'Address in schema and on page',
      'Phone number in schema and on page',
      'Name, address, and phone match between schema and visible page',
      'Address verifies on a map',
      'Links to social profiles (Facebook, Instagram, Yelp, etc.)',
      'Social profile links are active',
    ],
  },
  extractability_schema: {
    icon: <Code2 className="h-6 w-6" />,
    checks: [
      'Any structured data (JSON-LD) present',
      'Breadcrumb schema for navigation',
      'FAQ schema markup',
      'Structured data parses correctly',
      'Sitemap.xml file exists',
      'Robots.txt file exists',
      'AI bots (ChatGPT, Perplexity, etc.) are allowed to read your site',
      'Canonical tag present',
      'Meta description exists and is the right length',
    ],
  },
  freshness_maintenance: {
    icon: <RefreshCw className="h-6 w-6" />,
    checks: [
      'Site has archived history (exists on the web)',
      'How often your site content changes (update frequency)',
      'Sitemap shows recent updates',
      'Internal links are working (no broken pages)',
      'Copyright year is current',
      'Content contains recent dates',
    ],
  },
  trust_risk: {
    icon: <ShieldCheck className="h-6 w-6" />,
    checks: [
      'HTTPS with valid security certificate',
      'Security headers present (3 types checked)',
      'Page load speed (from real user data)',
      'Visual stability (content doesn\'t jump around)',
      'Page responsiveness (reacts quickly to taps/clicks)',
      'No insecure resources on secure pages',
      'Privacy policy present',
    ],
  },
  answerability_coverage: {
    icon: <MessageCircleQuestion className="h-6 w-6" />,
    checks: [
      'Business hours listed',
      'Pricing or cost information',
      'Location or service area',
      'Contact methods (phone, email, form)',
      'FAQ-style content (questions and answers)',
      'Service or product descriptions',
      'Enough content for AI to work with (300+ words)',
      'Clear heading structure (H1, H2, H3)',
    ],
  },
};

export default function HowWeScorePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        How We Score Your AI Visibility
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Your AIRI score (0-100) measures how likely AI search engines are to
        find, trust, and recommend your business. Here&apos;s exactly what we
        check and why it matters.
      </p>

      <div className="mt-6 rounded-lg border border-border/40 bg-muted/20 p-4">
        <h3 className="text-sm font-semibold">What we don&apos;t do</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          We never access your analytics, passwords, or private data. Everything
          we check is publicly visible on your website — the same things AI
          systems see when they visit your site.
        </p>
      </div>

      <div className="mt-10 space-y-10">
        {(Object.keys(PILLAR_DETAILS) as PillarName[]).map((key) => {
          const detail = PILLAR_DETAILS[key];
          return (
            <section key={key}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {detail.icon}
                </div>
                <div>
                  <h2 className="text-lg font-semibold">
                    {PILLAR_LABELS[key]}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {PILLAR_MAX_POINTS[key]} points possible
                  </p>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {PILLAR_DESCRIPTIONS[key]}
              </p>
              <ul className="mt-3 space-y-1">
                {detail.checks.map((check, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                    {check}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <section className="mt-12 rounded-lg border border-border/40 bg-card p-6">
        <h2 className="text-lg font-semibold">Understanding Your Grade</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <GradeExplainer grade="A+ / A" range="80-100" label="Excellent / Great" />
          <GradeExplainer grade="B+ / B" range="60-79" label="Good / Above Average" />
          <GradeExplainer grade="C+ / C" range="40-59" label="Average / Below Average" />
          <GradeExplainer grade="D / F" range="0-39" label="Poor / Needs Attention" />
        </div>
      </section>
    </div>
  );
}

function GradeExplainer({
  grade,
  range,
  label,
}: {
  grade: string;
  range: string;
  label: string;
}) {
  return (
    <div className="rounded-md border border-border/40 p-3 text-center">
      <div className="text-lg font-bold">{grade}</div>
      <div className="text-xs text-muted-foreground">{range} pts</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

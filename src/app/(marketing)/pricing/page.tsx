import type { Metadata } from 'next';
import { Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Simple, affordable plans to keep your business visible to AI. Start with a free scan.',
};

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    description: 'See where you stand',
    features: [
      '1 free scan per day',
      'AI Visibility Score (0-100)',
      '5 pillar breakdown',
      'Top 5 fix recommendations',
      'Shareable results link',
    ],
    cta: 'Scan Now — Free',
    href: '/',
    highlight: false,
  },
  {
    name: 'Monitor',
    price: '$8',
    period: '/month',
    description: 'Stay on top of changes',
    features: [
      'Everything in Free',
      'Monthly automated rescans',
      'Email alerts when score changes',
      'Score history over time',
      'All recommendations unlocked',
      'Full how-to-fix instructions',
    ],
    cta: 'Coming Soon',
    href: '#',
    highlight: false,
  },
  {
    name: 'DIY',
    price: '$29',
    period: '/month',
    description: 'Fix it yourself with guidance',
    features: [
      'Everything in Monitor',
      'Step-by-step fix wizard',
      'Schema markup generator',
      'FAQ content generator',
      'Guided optimization checklist',
      '100 scans per month',
    ],
    cta: 'Coming Soon',
    href: '#',
    highlight: true,
  },
  {
    name: 'Pro',
    price: '$99',
    period: '/month',
    description: 'For serious businesses',
    features: [
      'Everything in DIY',
      'Scan up to 10 pages per domain',
      'Competitor comparison (2 sites)',
      'Priority recommendations',
      'CSV data export',
      '500 scans per month',
    ],
    cta: 'Coming Soon',
    href: '#',
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Simple, Honest Pricing
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Start for free. Upgrade when you need more.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={`relative flex flex-col ${plan.highlight ? 'border-primary shadow-md' : ''}`}
          >
            {plan.highlight && (
              <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                Most Popular
              </Badge>
            )}
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{plan.price}</span>
                {plan.period && (
                  <span className="text-sm text-muted-foreground">
                    {plan.period}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {plan.description}
              </p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <ul className="flex-1 space-y-2">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href={plan.href}
                className={`mt-6 block w-full rounded-md py-2 text-center text-sm font-medium transition-colors ${
                  plan.highlight
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'border border-border bg-background hover:bg-muted'
                } ${plan.href === '#' ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                {plan.cta}
              </a>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Done For You */}
      <section className="mt-12 rounded-lg border border-border/40 bg-card p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">
              Want us to do it for you?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Our team will optimize your website for AI visibility. One-time
              setup or ongoing management — whatever your business needs.
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <div>
                <span className="font-semibold">$500–$2,000</span>
                <span className="text-muted-foreground"> one-time setup</span>
              </div>
              <div>
                <span className="font-semibold">$300–$500</span>
                <span className="text-muted-foreground">/month retainer</span>
              </div>
            </div>
          </div>
          <a
            href="mailto:hello@airi.app"
            className="shrink-0 rounded-md bg-foreground px-6 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
          >
            Contact Us
          </a>
        </div>
      </section>
    </div>
  );
}

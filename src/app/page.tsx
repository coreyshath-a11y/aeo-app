import { UrlInputForm } from '@/components/scan/url-input-form';
import {
  Search,
  BarChart3,
  Wrench,
  MessageCircle,
  Bot,
  Globe,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="flex flex-col items-center px-4 pb-16 pt-20 text-center sm:pt-28">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
          <Bot className="h-3 w-3" />
          Free AI visibility check
        </div>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Is Your Business{' '}
          <span className="text-primary">Visible to AI?</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground sm:text-xl">
          When someone asks ChatGPT, Perplexity, or Google AI about your
          industry — does your business show up? Find out in 30 seconds.
        </p>
        <div className="mt-8 w-full max-w-xl">
          <UrlInputForm size="large" />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          No sign-up required. We scan your public website — nothing private.
        </p>
      </section>

      {/* How It Works */}
      <section className="border-t border-border/40 bg-muted/20 px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            How It Works
          </h2>
          <p className="mt-2 text-center text-muted-foreground">
            Three steps, thirty seconds, zero confusion.
          </p>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            <Step
              number={1}
              icon={<Search className="h-6 w-6" />}
              title="Enter Your URL"
              description="Type in your website address. We'll take it from there."
            />
            <Step
              number={2}
              icon={<BarChart3 className="h-6 w-6" />}
              title="Get Your Score"
              description="We check 30+ factors that determine if AI can find and recommend your business."
            />
            <Step
              number={3}
              icon={<Wrench className="h-6 w-6" />}
              title="See What to Fix"
              description="Get clear, prioritized steps to make your business more visible to AI search."
            />
          </div>
        </div>
      </section>

      {/* Why This Matters */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">
            Why This Matters
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-muted-foreground">
            People are changing how they search. Instead of scrolling through
            Google, they&apos;re asking AI for answers. If your business
            isn&apos;t set up for this, you&apos;re invisible.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <WhyCard
              icon={<MessageCircle className="h-5 w-5" />}
              title="AI is the new search"
              description="Millions of people now ask ChatGPT and Perplexity instead of Googling. If AI can't find you, those customers go to your competitors."
            />
            <WhyCard
              icon={<Globe className="h-5 w-5" />}
              title="Your website needs to speak AI"
              description="AI doesn't read websites like people do. It needs structured data, clear answers, and consistent business information to recommend you."
            />
            <WhyCard
              icon={<BarChart3 className="h-5 w-5" />}
              title="Most businesses score under 40"
              description="The average small business website isn't set up for AI at all. Getting even basic optimizations in place puts you ahead of most competitors."
            />
            <WhyCard
              icon={<Wrench className="h-5 w-5" />}
              title="The fixes are simple"
              description="You don't need to rebuild your website. Most improvements take minutes, not months. We show you exactly what to do."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/40 bg-muted/20 px-4 py-16">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Ready to check your score?
          </h2>
          <p className="mt-2 text-muted-foreground">
            It&apos;s free, takes 30 seconds, and no sign-up is needed.
          </p>
          <div className="mt-6 flex justify-center">
            <UrlInputForm size="large" />
          </div>
        </div>
      </section>
    </div>
  );
}

function Step({
  number,
  icon,
  title,
  description,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="mt-1 text-xs font-medium text-muted-foreground">
        Step {number}
      </div>
      <h3 className="mt-2 text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function WhyCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-border/40 bg-card p-5">
      <div className="flex items-center gap-2 text-primary">{icon}</div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

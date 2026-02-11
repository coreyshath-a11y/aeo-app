import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About AIRI',
  description:
    'AIRI helps small businesses stay visible in the age of AI search. Learn about our mission.',
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        About AIRI
      </h1>

      <div className="mt-6 space-y-4 text-muted-foreground">
        <p>
          Search is changing. Millions of people now use ChatGPT, Perplexity,
          Google AI, and other AI tools to find businesses, compare services, and
          make decisions. But most small business websites aren&apos;t set up for
          this new world.
        </p>
        <p>
          AIRI (AI Recommendation Readiness Index) is a simple tool that checks
          whether AI search engines can find and recommend your business. We
          analyze your website across 5 key areas and give you a clear score
          with actionable steps to improve.
        </p>
        <p>
          We built AIRI because we saw a problem: business owners — especially
          those who aren&apos;t deeply technical — are being left behind by a
          massive shift in how people search. They don&apos;t need another
          complicated SEO dashboard. They need a straightforward answer: &ldquo;Am I
          showing up when people ask AI about my industry?&rdquo;
        </p>
        <p>
          That&apos;s what AIRI answers.
        </p>
      </div>

      <h2 className="mt-10 text-xl font-semibold">Our Principles</h2>
      <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
        <li className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span>
            <strong className="text-foreground">Accuracy over hype.</strong>{' '}
            Every point in your score is tied to a real, measurable signal. We
            don&apos;t make up numbers to scare you into buying something.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span>
            <strong className="text-foreground">
              Plain language, not jargon.
            </strong>{' '}
            If a 4th grader can&apos;t understand it, we rewrite it. You
            shouldn&apos;t need a tech degree to understand your own website.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span>
            <strong className="text-foreground">Transparency.</strong> We
            explain exactly what we check and where the data comes from. No
            black boxes.
          </span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span>
            <strong className="text-foreground">Privacy-first.</strong> We
            only scan publicly visible information on your website. We never
            access your analytics, passwords, or private data.
          </span>
        </li>
      </ul>
    </div>
  );
}

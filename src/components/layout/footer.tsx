import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            AIRI — AI Recommendation Readiness Index
          </p>
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/how-we-score" className="hover:text-foreground">
              How We Score
            </Link>
            <Link href="/pricing" className="hover:text-foreground">
              Pricing
            </Link>
            <Link href="/about" className="hover:text-foreground">
              About
            </Link>
          </nav>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} AIRI. Helping businesses stay visible in the age of AI.
        </p>
      </div>
    </footer>
  );
}

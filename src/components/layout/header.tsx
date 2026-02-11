import Link from 'next/link';
import { Activity } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold tracking-tight">AIRI</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/how-we-score"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            How It Works
          </Link>
          <Link
            href="/pricing"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
        </nav>
      </div>
    </header>
  );
}

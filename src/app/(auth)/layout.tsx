import Link from 'next/link';
import { Activity } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <Activity className="h-7 w-7 text-primary" />
        <span className="text-xl font-bold tracking-tight">AIRI</span>
      </Link>
      {children}
    </div>
  );
}

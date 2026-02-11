import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Email confirmation handler.
 *
 * Supabase can redirect here in two ways:
 *
 * 1. PKCE flow (default with @supabase/ssr): ?code=xxx
 *    - exchangeCodeForSession() turns the code into a session
 *
 * 2. Legacy/implicit flow: ?token_hash=xxx&type=signup
 *    - verifyOtp() confirms the email
 *
 * Both result in an active session, then we redirect to dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as
    | 'signup'
    | 'recovery'
    | 'email'
    | null;
  const next = searchParams.get('next') || '/dashboard';

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from Server Component context — ignore
          }
        },
      },
    }
  );

  // PKCE flow: exchange code for session
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Legacy flow: verify OTP token
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Something went wrong — redirect to login with error
  return NextResponse.redirect(
    `${origin}/login?error=confirmation_failed`
  );
}

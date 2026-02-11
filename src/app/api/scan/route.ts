import { NextResponse } from 'next/server';
import { after } from 'next/server';
import { nanoid } from 'nanoid';
import { urlSchema, normalizeUrl } from '@/lib/utils/url';
import { checkRateLimit } from '@/lib/utils/rate-limiter';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { runScan } from '@/lib/scan-engine';

// Allow up to 60 seconds for Vercel serverless execution
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Validate URL
    const parseResult = urlSchema.safeParse(body.url);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Please enter a valid website URL' },
        { status: 400 }
      );
    }

    const url = parseResult.data;
    const normalizedUrl = normalizeUrl(url);

    // 2. Get IP address
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // 3. Check auth state
    let userId: string | null = null;
    let tier: 'anonymous' | 'free' | 'monitor' | 'diy' | 'pro' = 'anonymous';

    try {
      const supabaseAuth = await createClient();
      const {
        data: { user },
      } = await supabaseAuth.auth.getUser();

      if (user) {
        userId = user.id;

        // Get user tier from profiles
        const admin = createAdminClient();
        const { data: profile } = await admin
          .from('profiles')
          .select('tier')
          .eq('id', user.id)
          .single();

        tier = (profile?.tier as typeof tier) || 'free';
      }
    } catch {
      // Auth check failed — treat as anonymous
    }

    // 4. Rate limiting (Supabase-backed)
    const rateCheck = await checkRateLimit(ip, userId, tier);

    if (!rateCheck.allowed) {
      const message =
        tier === 'anonymous'
          ? "You've reached the free scan limit. Create a free account to get more scans — it only takes 30 seconds."
          : "You've reached your daily scan limit. Upgrade your plan for more scans.";

      return NextResponse.json(
        {
          error: message,
          resetAt: rateCheck.resetAt,
        },
        { status: 429 }
      );
    }

    const supabase = createAdminClient();

    // 5. Check cache
    const { data: cached } = await supabase
      .from('scan_cache')
      .select('scan_id, expires_at')
      .eq('normalized_url', normalizedUrl)
      .single();

    if (cached && new Date(cached.expires_at) > new Date()) {
      return NextResponse.json({
        scanId: cached.scan_id,
        cached: true,
      });
    }

    // 6. Create scan record
    const scanId = `sc_${nanoid(16)}`;
    const { error: insertError } = await supabase.from('scans').insert({
      id: scanId,
      url,
      normalized_url: normalizedUrl,
      status: 'pending',
      ip_address: ip,
      user_id: userId,
    });

    if (insertError) {
      console.error('Failed to create scan:', insertError);
      return NextResponse.json(
        { error: 'Failed to start scan. Please try again.' },
        { status: 500 }
      );
    }

    // 7. Run scan in background
    after(async () => {
      try {
        await runScan(scanId, url);
      } catch (error) {
        console.error(`Scan ${scanId} failed:`, error);
        // runScan already updates the status to 'failed'
      }
    });

    // 8. Return immediately
    return NextResponse.json({ scanId, cached: false });
  } catch (error) {
    console.error('Scan API error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

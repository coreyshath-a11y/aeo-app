import { NextResponse } from 'next/server';
import { after } from 'next/server';
import { nanoid } from 'nanoid';
import { urlSchema, normalizeUrl } from '@/lib/utils/url';
import { checkRateLimit } from '@/lib/utils/rate-limiter';
import { createAdminClient } from '@/lib/supabase/admin';
import { runScan } from '@/lib/scan-engine';

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

    // 2. Rate limiting
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const maxPerHour = parseInt(
      process.env.RATE_LIMIT_ANON_PER_HOUR || '3',
      10
    );
    const rateCheck = checkRateLimit(
      `scan:${ip}`,
      maxPerHour,
      60 * 60 * 1000
    );

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error:
            'You\'ve reached the scan limit. Try again in a bit, or create a free account for more scans.',
          resetAt: rateCheck.resetAt,
        },
        { status: 429 }
      );
    }

    const supabase = createAdminClient();

    // 3. Check cache
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

    // 4. Create scan record
    const scanId = `sc_${nanoid(16)}`;
    const { error: insertError } = await supabase.from('scans').insert({
      id: scanId,
      url,
      normalized_url: normalizedUrl,
      status: 'pending',
      ip_address: ip,
    });

    if (insertError) {
      console.error('Failed to create scan:', insertError);
      return NextResponse.json(
        { error: 'Failed to start scan. Please try again.' },
        { status: 500 }
      );
    }

    // 5. Run scan in background
    after(async () => {
      try {
        await runScan(scanId, url);
      } catch (error) {
        console.error(`Scan ${scanId} failed:`, error);
        // runScan already updates the status to 'failed'
      }
    });

    // 6. Return immediately
    return NextResponse.json({ scanId, cached: false });
  } catch (error) {
    console.error('Scan API error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

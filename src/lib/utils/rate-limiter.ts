import { createAdminClient } from '@/lib/supabase/admin';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Supabase-backed rate limiter — works across all serverless instances.
 *
 * Anonymous users: counted by IP address (scans in last hour)
 * Authenticated users: counted by user_id (scans today)
 */
export async function checkRateLimit(
  ip: string,
  userId: string | null,
  tier: 'anonymous' | 'free' | 'monitor' | 'diy' | 'pro' = 'anonymous'
): Promise<RateLimitResult> {
  const supabase = createAdminClient();

  // Tier limits
  const limits: Record<string, { max: number; windowMs: number }> = {
    anonymous: { max: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
    free: { max: 5, windowMs: 24 * 60 * 60 * 1000 }, // 5 per day
    monitor: { max: 30, windowMs: 24 * 60 * 60 * 1000 }, // 30 per day
    diy: { max: 100, windowMs: 24 * 60 * 60 * 1000 }, // 100 per day
    pro: { max: 500, windowMs: 24 * 60 * 60 * 1000 }, // 500 per day
  };

  const { max, windowMs } = limits[tier] || limits.anonymous;
  const windowStart = new Date(Date.now() - windowMs).toISOString();
  const resetAt = Date.now() + windowMs;

  let count = 0;

  if (userId && tier !== 'anonymous') {
    // Authenticated: count by user_id in window
    const { count: rowCount, error } = await supabase
      .from('scans')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', windowStart);

    if (!error) {
      count = rowCount || 0;
    }
  } else {
    // Anonymous: count by IP in window
    const { count: rowCount, error } = await supabase
      .from('scans')
      .select('*', { count: 'exact', head: true })
      .eq('ip_address', ip)
      .is('user_id', null)
      .gte('created_at', windowStart);

    if (!error) {
      count = rowCount || 0;
    }
  }

  const allowed = count < max;
  const remaining = Math.max(0, max - count);

  return { allowed, remaining, resetAt };
}

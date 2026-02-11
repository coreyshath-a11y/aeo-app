import * as tls from 'tls';
import type { CrawlResult, TLSInfo } from '@/types/scan';

const CRAWL_TIMEOUT_MS = 15_000;
const MAX_HTML_SIZE = 5 * 1024 * 1024; // 5MB
const TLS_TIMEOUT_MS = 3_000;

// Realistic Chrome UA — prevents WAF/bot detection blocking
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent': USER_AGENT,
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-User': '?1',
  'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Upgrade-Insecure-Requests': '1',
  'Cache-Control': 'max-age=0',
};

export async function crawl(url: string): Promise<CrawlResult> {
  const startTime = Date.now();
  const redirectChain: string[] = [];
  let currentUrl = url;
  let response: Response | null = null;

  // Follow redirects manually to track the chain (up to 8 hops)
  for (let i = 0; i < 8; i++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CRAWL_TIMEOUT_MS);

    try {
      response = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: 'manual',
        headers: BROWSER_HEADERS,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (
      response.status >= 300 &&
      response.status < 400 &&
      response.headers.get('location')
    ) {
      redirectChain.push(currentUrl);
      const location = response.headers.get('location')!;
      currentUrl = new URL(location, currentUrl).href;
      continue;
    }

    break;
  }

  if (!response) {
    throw new Error('Failed to fetch URL after following redirects');
  }

  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  let html = await response.text();
  if (html.length > MAX_HTML_SIZE) {
    html = html.slice(0, MAX_HTML_SIZE);
  }

  // Get TLS info for HTTPS URLs (non-critical — 3s hard timeout)
  let tlsInfo: TLSInfo | null = null;
  try {
    const parsed = new URL(currentUrl);
    if (parsed.protocol === 'https:') {
      tlsInfo = await Promise.race([
        checkTLS(parsed.hostname),
        new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), TLS_TIMEOUT_MS)
        ),
      ]);
    }
  } catch {
    // TLS check failed — non-critical, continue with null
  }

  return {
    html,
    statusCode: response.status,
    headers,
    redirectChain,
    finalUrl: currentUrl,
    responseTimeMs: Date.now() - startTime,
    tlsInfo,
  };
}

function checkTLS(hostname: string): Promise<TLSInfo> {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(
      {
        host: hostname,
        port: 443,
        servername: hostname,
      },
      () => {
        try {
          const cert = socket.getPeerCertificate();
          if (!cert || !cert.subject) {
            socket.destroy();
            reject(new Error('No certificate found'));
            return;
          }

          const result: TLSInfo = {
            valid: socket.authorized ?? false,
            issuer: cert.issuer?.O || cert.issuer?.CN || 'Unknown',
            expiresAt: cert.valid_to || '',
            protocol: socket.getProtocol() || 'unknown',
          };

          socket.destroy();
          resolve(result);
        } catch (err) {
          socket.destroy();
          reject(err);
        }
      }
    );

    socket.on('error', (err) => {
      socket.destroy();
      reject(err);
    });
  });
}

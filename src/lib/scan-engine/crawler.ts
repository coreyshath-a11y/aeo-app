import * as tls from 'tls';
import type { CrawlResult, TLSInfo } from '@/types/scan';

const CRAWL_TIMEOUT_MS = 10_000;
const MAX_HTML_SIZE = 5 * 1024 * 1024; // 5MB
const USER_AGENT = 'AIRI-Scanner/1.0 (AI Visibility Check)';

export async function crawl(url: string): Promise<CrawlResult> {
  const startTime = Date.now();
  const redirectChain: string[] = [];
  let currentUrl = url;
  let response: Response | null = null;

  // Follow redirects manually to track the chain
  for (let i = 0; i < 5; i++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CRAWL_TIMEOUT_MS);

    try {
      response = await fetch(currentUrl, {
        signal: controller.signal,
        redirect: 'manual',
        headers: {
          'User-Agent': USER_AGENT,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
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

  // Get TLS info for HTTPS URLs
  let tlsInfo: TLSInfo | null = null;
  try {
    const parsed = new URL(currentUrl);
    if (parsed.protocol === 'https:') {
      tlsInfo = await checkTLS(parsed.hostname);
    }
  } catch {
    // TLS check failed — non-critical
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
        timeout: 5000,
      },
      () => {
        const cert = socket.getPeerCertificate();
        if (!cert || !cert.subject) {
          socket.destroy();
          reject(new Error('No certificate found'));
          return;
        }

        resolve({
          valid: socket.authorized ?? false,
          issuer: cert.issuer?.O || cert.issuer?.CN || 'Unknown',
          expiresAt: cert.valid_to || '',
          protocol: socket.getProtocol() || 'unknown',
        });

        socket.destroy();
      }
    );

    socket.on('error', (err) => {
      socket.destroy();
      reject(err);
    });

    socket.setTimeout(5000, () => {
      socket.destroy();
      reject(new Error('TLS check timed out'));
    });
  });
}

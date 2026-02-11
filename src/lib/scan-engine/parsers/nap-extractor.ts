import * as cheerio from 'cheerio';

export interface ExtractedNAP {
  names: string[];
  addresses: string[];
  phones: string[];
  emails: string[];
}

// US/CA phone patterns
const PHONE_REGEX =
  /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}(?:\s*(?:ext|x|extension)\s*\d+)?/gi;

// Simple email pattern
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// US address patterns (simplified — catches most formats)
const ADDRESS_REGEX =
  /\d{1,5}\s+(?:[A-Za-z0-9]+\s){1,4}(?:St(?:reet)?|Ave(?:nue)?|Blvd|Boulevard|Dr(?:ive)?|Rd|Road|Ln|Lane|Way|Ct|Court|Pl(?:ace)?|Pkwy|Parkway|Cir(?:cle)?|Hwy|Highway)[.,]?\s*(?:(?:Suite|Ste|Apt|Unit|#)\s*[A-Za-z0-9-]+[.,]?\s*)?(?:[A-Za-z\s]+,\s*)?(?:[A-Z]{2}\s+)?\d{5}(?:-\d{4})?/gi;

export function extractNAPFromHtml(html: string): ExtractedNAP {
  const $ = cheerio.load(html);

  // Remove script and style tags to avoid false positives
  $('script, style, noscript').remove();

  const bodyText = $('body').text();
  const names: string[] = [];
  const addresses: string[] = [];
  const phones: string[] = [];
  const emails: string[] = [];

  // Extract phones
  const phoneMatches = bodyText.match(PHONE_REGEX);
  if (phoneMatches) {
    phones.push(...new Set(phoneMatches.map(normalizePhone)));
  }

  // Extract emails
  const emailMatches = bodyText.match(EMAIL_REGEX);
  if (emailMatches) {
    emails.push(
      ...new Set(emailMatches.map((e) => e.toLowerCase()))
    );
  }

  // Extract addresses
  const addressMatches = bodyText.match(ADDRESS_REGEX);
  if (addressMatches) {
    addresses.push(...new Set(addressMatches.map((a) => a.trim())));
  }

  // Try to get business name from common places
  // 1. <title> tag (often "Business Name | Tagline")
  const title = $('title').text().trim();
  if (title) {
    const namePart = title.split(/[|–—-]/)[0].trim();
    if (namePart && namePart.length > 1 && namePart.length < 100) {
      names.push(namePart);
    }
  }

  // 2. og:site_name
  const siteName = $('meta[property="og:site_name"]').attr('content');
  if (siteName) {
    names.push(siteName.trim());
  }

  // 3. First h1
  const h1 = $('h1').first().text().trim();
  if (h1 && h1.length > 1 && h1.length < 100) {
    names.push(h1);
  }

  return {
    names: [...new Set(names)],
    addresses: [...new Set(addresses)],
    phones: [...new Set(phones)],
    emails: [...new Set(emails)],
  };
}

export function extractNAPFromSchema(
  schema: Record<string, unknown> | null
): ExtractedNAP {
  if (!schema) {
    return { names: [], addresses: [], phones: [], emails: [] };
  }

  const names: string[] = [];
  const addresses: string[] = [];
  const phones: string[] = [];
  const emails: string[] = [];

  // Name
  if (typeof schema.name === 'string') {
    names.push(schema.name);
  }

  // Phone
  if (typeof schema.telephone === 'string') {
    phones.push(normalizePhone(schema.telephone));
  }

  // Email
  if (typeof schema.email === 'string') {
    emails.push(schema.email.toLowerCase());
  }

  // Address
  const address = schema.address as Record<string, unknown> | undefined;
  if (address && typeof address === 'object') {
    const parts = [
      address.streetAddress,
      address.addressLocality,
      address.addressRegion,
      address.postalCode,
    ]
      .filter((p) => typeof p === 'string')
      .join(', ');
    if (parts) {
      addresses.push(parts);
    }
  }

  return { names, addresses, phones, emails };
}

function normalizePhone(phone: string): string {
  // Strip to digits only
  return phone.replace(/\D/g, '').replace(/^1/, '');
}

export function napConsistencyCheck(
  htmlNap: ExtractedNAP,
  schemaNap: ExtractedNAP
): { nameMatch: boolean; phoneMatch: boolean; addressMatch: boolean } {
  const nameMatch =
    schemaNap.names.length > 0 &&
    htmlNap.names.length > 0 &&
    schemaNap.names.some((sn) =>
      htmlNap.names.some(
        (hn) =>
          hn.toLowerCase().includes(sn.toLowerCase()) ||
          sn.toLowerCase().includes(hn.toLowerCase())
      )
    );

  const phoneMatch =
    schemaNap.phones.length > 0 &&
    htmlNap.phones.length > 0 &&
    schemaNap.phones.some((sp) => htmlNap.phones.includes(sp));

  const addressMatch =
    schemaNap.addresses.length > 0 &&
    htmlNap.addresses.length > 0 &&
    schemaNap.addresses.some((sa) =>
      htmlNap.addresses.some((ha) => {
        // Fuzzy match: check if key parts of the address appear
        const saWords = sa.toLowerCase().split(/[\s,]+/).filter(Boolean);
        const haLower = ha.toLowerCase();
        const matchingWords = saWords.filter((w) => haLower.includes(w));
        return matchingWords.length >= Math.min(3, saWords.length);
      })
    );

  return { nameMatch, phoneMatch, addressMatch };
}

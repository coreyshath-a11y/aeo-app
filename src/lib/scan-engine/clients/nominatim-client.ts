export interface NominatimResult {
  found: boolean;
  displayName: string | null;
  lat: number | null;
  lon: number | null;
  type: string | null;
  importance: number | null;
  error: string | null;
}

const NOMINATIM_TIMEOUT_MS = 8000;

// Nominatim requires max 1 request per second for the public API
let lastRequestTime = 0;

async function rateLimitWait() {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < 1100) {
    // 1.1 seconds to be safe
    await new Promise((resolve) => setTimeout(resolve, 1100 - elapsed));
  }
  lastRequestTime = Date.now();
}

export async function geocodeAddress(
  address: string
): Promise<NominatimResult> {
  if (!address || address.trim().length < 5) {
    return {
      found: false,
      displayName: null,
      lat: null,
      lon: null,
      type: null,
      importance: null,
      error: 'Address too short to geocode',
    };
  }

  try {
    await rateLimitWait();

    const params = new URLSearchParams({
      q: address,
      format: 'json',
      limit: '1',
      addressdetails: '1',
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), NOMINATIM_TIMEOUT_MS);

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        signal: controller.signal,
        headers: {
          'User-Agent': 'AIRI-Scanner/1.0 (AI Visibility Check Tool)',
          Accept: 'application/json',
        },
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        found: false,
        displayName: null,
        lat: null,
        lon: null,
        type: null,
        importance: null,
        error: `Nominatim API returned ${response.status}`,
      };
    }

    const results = (await response.json()) as Array<{
      display_name: string;
      lat: string;
      lon: string;
      type: string;
      importance: number;
    }>;

    if (!results || results.length === 0) {
      return {
        found: false,
        displayName: null,
        lat: null,
        lon: null,
        type: null,
        importance: null,
        error: null,
      };
    }

    const result = results[0];
    return {
      found: true,
      displayName: result.display_name,
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      type: result.type,
      importance: result.importance,
      error: null,
    };
  } catch (error) {
    return {
      found: false,
      displayName: null,
      lat: null,
      lon: null,
      type: null,
      importance: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

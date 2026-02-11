import * as cheerio from 'cheerio';

export interface SchemaData {
  types: string[];
  raw: Record<string, unknown>[];
  organization: Record<string, unknown> | null;
  localBusiness: Record<string, unknown> | null;
  faqPage: Record<string, unknown> | null;
  breadcrumbList: Record<string, unknown> | null;
  website: Record<string, unknown> | null;
}

export function extractJsonLd(html: string): SchemaData {
  const $ = cheerio.load(html);
  const schemas: Record<string, unknown>[] = [];
  const types: string[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const text = $(el).text().trim();
      if (!text) return;
      const parsed = JSON.parse(text);
      // Handle @graph arrays
      const items = Array.isArray(parsed)
        ? parsed
        : parsed['@graph']
          ? parsed['@graph']
          : [parsed];
      for (const item of items) {
        if (item && typeof item === 'object') {
          schemas.push(item as Record<string, unknown>);
          const type = getType(item as Record<string, unknown>);
          if (type) types.push(...(Array.isArray(type) ? type : [type]));
        }
      }
    } catch {
      // Invalid JSON-LD — skip
    }
  });

  return {
    types,
    raw: schemas,
    organization: findByType(schemas, 'Organization'),
    localBusiness: findByType(schemas, 'LocalBusiness'),
    faqPage: findByType(schemas, 'FAQPage'),
    breadcrumbList: findByType(schemas, 'BreadcrumbList'),
    website: findByType(schemas, 'WebSite'),
  };
}

function getType(
  schema: Record<string, unknown>
): string | string[] | undefined {
  const type = schema['@type'];
  if (typeof type === 'string') return type;
  if (Array.isArray(type)) return type.filter((t) => typeof t === 'string');
  return undefined;
}

function findByType(
  schemas: Record<string, unknown>[],
  targetType: string
): Record<string, unknown> | null {
  for (const schema of schemas) {
    const type = getType(schema);
    if (!type) continue;
    const types = Array.isArray(type) ? type : [type];
    // Check if any type matches or is a subtype (e.g. "Restaurant" extends "LocalBusiness")
    if (types.some((t) => t === targetType || isSubtypeOf(t, targetType))) {
      return schema;
    }
  }
  return null;
}

// Common Schema.org subtypes for LocalBusiness
const LOCAL_BUSINESS_SUBTYPES = new Set([
  'Restaurant',
  'BarOrPub',
  'CafeOrCoffeeShop',
  'FastFoodRestaurant',
  'Bakery',
  'Dentist',
  'Physician',
  'Optician',
  'MedicalClinic',
  'HealthClub',
  'LodgingBusiness',
  'Hotel',
  'Motel',
  'AutoRepair',
  'AutoDealer',
  'BeautySalon',
  'HairSalon',
  'DaySpa',
  'RealEstateAgent',
  'InsuranceAgency',
  'LegalService',
  'Attorney',
  'Notary',
  'AccountingService',
  'FinancialService',
  'Store',
  'ClothingStore',
  'ElectronicsStore',
  'GroceryStore',
  'HardwareStore',
  'HomeGoodsStore',
  'PetStore',
  'SportingGoodsStore',
  'EntertainmentBusiness',
  'AmusementPark',
  'MovieTheater',
  'TouristAttraction',
]);

function isSubtypeOf(type: string, parentType: string): boolean {
  if (parentType === 'LocalBusiness') {
    return LOCAL_BUSINESS_SUBTYPES.has(type);
  }
  return false;
}

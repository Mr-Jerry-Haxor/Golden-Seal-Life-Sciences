const CLOUDINARY_UPLOAD_MARKER = '/upload/';
const CLOUDINARY_HOST = 'res.cloudinary.com';
const NEW_DEFAULT_LOGO_URL =
  'https://res.cloudinary.com/dvqdwq4wa/image/upload/v1775057069/golden-seal-life-sciences/8fad8b50f20e7c9f1bb384a75da41da081020781a3ab9ea8b4acaf4234723b70.png';
const LEGACY_LOGO_IDENTIFIERS = [
  'im3sff6vtb9revpoiil5',
  'wcdtehetosq3esxtubej'
];

export const GOLDEN_SEAL_LOGO_URL =
  NEW_DEFAULT_LOGO_URL;

export const GOLDEN_SEAL_LOGO_WITH_BG_URL =
  NEW_DEFAULT_LOGO_URL;

export const BRAND_LOGO_TRANSFORMS = {
  headerIcon: 'f_auto,q_auto,dpr_auto,c_fit,w_96,h_96',
  headerBadge: 'f_auto,q_auto,dpr_auto,c_fit,w_180,h_180',
  heroMark: 'f_auto,q_auto,dpr_auto,c_fit,w_360,h_180',
  adminSidebar: 'f_auto,q_auto,dpr_auto,c_fit,w_220,h_120',
  adminAuth: 'f_auto,q_auto,dpr_auto,c_fit,w_260,h_140',
  favicon: 'f_auto,q_auto,dpr_auto,c_fit,w_64,h_64'
} as const;

type BrandLogoVariant = keyof typeof BRAND_LOGO_TRANSFORMS;

function isCloudinaryImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.endsWith(CLOUDINARY_HOST) && parsed.pathname.includes('/image/upload/');
  } catch {
    return false;
  }
}

function resolveBrandSourceUrl(sourceUrl: string | null | undefined): string {
  const normalizedSource = sourceUrl?.trim() || '';
  if (!normalizedSource) {
    return GOLDEN_SEAL_LOGO_URL;
  }

  const isLegacyLogoUrl = LEGACY_LOGO_IDENTIFIERS.some((identifier) => normalizedSource.includes(identifier));
  if (isLegacyLogoUrl) {
    return GOLDEN_SEAL_LOGO_URL;
  }

  return isCloudinaryImageUrl(normalizedSource) ? normalizedSource : GOLDEN_SEAL_LOGO_URL;
}

export function withCloudinaryTransform(url: string, transformation: string): string {
  if (!url || !transformation) {
    return url;
  }

  const [pathPart, queryPart] = url.split('?');
  const markerIndex = pathPart.indexOf(CLOUDINARY_UPLOAD_MARKER);
  if (markerIndex < 0) {
    return url;
  }

  const prefix = pathPart.slice(0, markerIndex + CLOUDINARY_UPLOAD_MARKER.length);
  const suffix = pathPart.slice(markerIndex + CLOUDINARY_UPLOAD_MARKER.length).replace(/^\/+/, '');
  const normalizedTransformation = transformation.replace(/^\/+|\/+$/g, '');

  if (!suffix || !normalizedTransformation) {
    return url;
  }

  const transformationPrefix = `${normalizedTransformation}/`;
  const nextPath = suffix.startsWith(transformationPrefix)
    ? `${prefix}${suffix}`
    : `${prefix}${normalizedTransformation}/${suffix}`;

  return queryPart ? `${nextPath}?${queryPart}` : nextPath;
}

export function getBrandLogoUrl(sourceUrl: string | null | undefined, variant: BrandLogoVariant): string {
  const baseUrl = resolveBrandSourceUrl(sourceUrl);
  return withCloudinaryTransform(baseUrl, BRAND_LOGO_TRANSFORMS[variant]);
}

export function getBrandLogoWithBackgroundUrl(variant: BrandLogoVariant): string {
  return withCloudinaryTransform(GOLDEN_SEAL_LOGO_WITH_BG_URL, BRAND_LOGO_TRANSFORMS[variant]);
}
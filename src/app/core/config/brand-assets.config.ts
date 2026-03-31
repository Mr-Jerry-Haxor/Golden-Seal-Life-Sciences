const CLOUDINARY_UPLOAD_MARKER = '/upload/';

export const GOLDEN_SEAL_LOGO_URL =
  'https://res.cloudinary.com/dvqdwq4wa/image/upload/v1774961077/im3sff6vtb9revpoiil5.png';

export const GOLDEN_SEAL_LOGO_WITH_BG_URL =
  'https://res.cloudinary.com/dvqdwq4wa/image/upload/v1774961077/wcdtehetosq3esxtubej.png';

export const BRAND_LOGO_TRANSFORMS = {
  headerIcon: 'f_auto,q_auto,dpr_auto,c_fit,w_96,h_96',
  headerBadge: 'f_auto,q_auto,dpr_auto,c_fit,w_180,h_180',
  heroMark: 'f_auto,q_auto,dpr_auto,c_fit,w_360,h_180',
  adminSidebar: 'f_auto,q_auto,dpr_auto,c_fit,w_220,h_120',
  adminAuth: 'f_auto,q_auto,dpr_auto,c_fit,w_260,h_140',
  favicon: 'f_auto,q_auto,dpr_auto,c_fit,w_64,h_64'
} as const;

type BrandLogoVariant = keyof typeof BRAND_LOGO_TRANSFORMS;

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
  const baseUrl = sourceUrl?.trim() || GOLDEN_SEAL_LOGO_URL;
  return withCloudinaryTransform(baseUrl, BRAND_LOGO_TRANSFORMS[variant]);
}

export function getBrandLogoWithBackgroundUrl(variant: BrandLogoVariant): string {
  return withCloudinaryTransform(GOLDEN_SEAL_LOGO_WITH_BG_URL, BRAND_LOGO_TRANSFORMS[variant]);
}
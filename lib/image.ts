/**
 * next/image can resize + convert local covers to small WebP/AVIF files
 * (a 2.5 MB PNG becomes ~25 KB). Remote URLs, blobs and SVGs are served as-is.
 */
export function canOptimize(src?: string | null): boolean {
  return !!src && src.startsWith("/") && !src.startsWith("//") && !/\.svg($|\?)/i.test(src);
}

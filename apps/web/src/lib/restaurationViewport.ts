/** Hub /restauration réservé mobile + tablette (< breakpoint `lg`). */

export const RESTAURATION_DESKTOP_MIN_WIDTH_PX = 1024

/** Visible uniquement sur mobile / tablette (< lg). */
export const RESTAURATION_MOBILE_ONLY_CLASS = 'lg:hidden'

/** Visible uniquement sur desktop (≥ lg). */
export const RESTAURATION_DESKTOP_ONLY_CLASS = 'hidden lg:block'

export function merchantMenuHrefDesktop(merchantSlug: string): string {
  return `/m/${merchantSlug}?tab=menu#profile-tabs`
}

export function restaurationHubDesktopFallback(categorySlug?: string): string {
  const slug = categorySlug?.trim() || 'restaurants'
  return `/categories/${slug}`
}

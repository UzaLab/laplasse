/** Zone scrollable des shells boutique / marchand (ShopShell, MerchantShell). */
export const APP_SHELL_SCROLL_ID = 'shop-manage-scroll'

export function scrollAppShellToTop() {
  document.getElementById(APP_SHELL_SCROLL_ID)?.scrollTo({ top: 0, behavior: 'smooth' })
}

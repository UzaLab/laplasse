/** LaPlasse brand tokens — aligned with apps/web globals.css (amber brand). */
export const colors = {
  brand50: '#fffbeb',
  brand100: '#fef3c7',
  brand200: '#fde68a',
  brand500: '#f59e0b',
  brand600: '#d97706',
  brand700: '#b45309',
  brand800: '#92400e',

  primary: '#d97706',
  primaryContainer: '#f59e0b',
  onPrimaryContainer: '#ffffff',
  onBackground: '#0f172a',
  onSurfaceVariant: '#64748b',
  outlineVariant: '#e2e8f0',
  surfaceContainer: '#f1f5f9',
  surfaceContainerLow: '#f8fafc',
  surfaceBright: '#ffffff',
  tertiary: '#64748b',

  primaryDark: '#b45309',
  background: '#FAFAFA',
  surface: '#ffffff',
  text: '#0f172a',
  textMuted: '#64748b',
  textLight: '#94a3b8',
  border: '#f1f5f9',
  borderStrong: '#e2e8f0',
  slate900: '#0f172a',
  danger: '#dc2626',
  success: '#16a34a',
  emerald50: '#ecfdf5',
  emerald700: '#047857',
}

export const radii = {
  field: 16,
  card: 24,
  button: 9999,
  pill: 9999,
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  gutter: 24,
}

export const layout = {
  bottomNavHeight: 56,
  bottomNavInset: 64,
  pageGutter: 16,
  /** Espace au-dessus de la bottom nav — aligné PWA (--mobile-bottom-content-gap: 0.75rem) */
  fabBottomGap: 12,
  /** Gouttière horizontale FAB — aligné PWA (px-6) */
  fabHorizontalGutter: 24,
}

export const homeLayout = {
  gutter: 16,
  topBarHeight: 52,
  stackSm: 8,
  stackMd: 12,
  stackLg: 24,
  radiusLg: 16,
  radiusXl: 24,
}

export const fonts = {
  regular: 'Outfit_400Regular',
  medium: 'Outfit_500Medium',
  semibold: 'Outfit_600SemiBold',
  bold: 'Outfit_700Bold',
  extrabold: 'Outfit_800ExtraBold',
}

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 4,
  },
}

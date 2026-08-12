import { colors, fonts } from '@/src/theme'

/** Profile area tokens — aligned with PWA ProfileShell (slate + amber). */
export const profileTheme = {
  bg: '#f8fafc',
  surface: '#ffffff',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  text: colors.text,
  textMuted: '#64748b',
  textLight: '#94a3b8',
  navActiveBg: colors.slate900,
  navActiveText: '#ffffff',
  navInactiveText: '#64748b',
  navIconActive: colors.brand500,
  accent: colors.brand600,
  accentLight: colors.brand50,
  danger: colors.danger,
  success: colors.emerald700,
  successBg: colors.emerald50,
  cardRadius: 28,
  cardRadiusSm: 20,
  navRadius: 16,
  fonts,
} as const

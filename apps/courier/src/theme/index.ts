/** LaPlasse Livraison — emerald accent for couriers & logistics partners. */
export const colors = {
  emerald50: '#ecfdf5',
  emerald100: '#d1fae5',
  emerald500: '#10b981',
  emerald600: '#059669',
  emerald700: '#047857',
  emerald800: '#065f46',

  primary: '#059669',
  primaryDark: '#047857',
  background: '#f9f9f9',
  surface: '#ffffff',
  text: '#0f172a',
  textMuted: '#64748b',
  textLight: '#94a3b8',
  onSurfaceVariant: '#45464d',
  border: '#f1f5f9',
  borderStrong: '#e2e8f0',
  borderSubtle: '#e2e8f0',
  slate900: '#0f172a',
  primaryContainer: '#131b2e',
  onTertiaryContainer: '#009668',
  tertiaryFixed: '#6ffbbe',
  tertiaryFixedDim: '#4edea3',
  tertiaryFixedMuted: 'rgba(111, 251, 190, 0.2)',
  inversePrimary: '#bec6e0',
  secondaryContainer: '#fea619',
  danger: '#dc2626',
  success: '#16a34a',
  warning: '#d97706',
  partnerAccent: '#0ea5e9',
}

/** Tokens from Docs/maquettes/interface_coursier.md */
export const maquette = {
  glassBg: 'rgba(255, 255, 255, 0.9)',
  glassBorder: 'rgba(226, 232, 240, 0.8)',
  sectionGap: 40,
  containerMargin: 20,
  gridGutter: 16,
}

export const radii = {
  field: 16,
  card: 24,
  button: 9999,
  glass: 12,
  glassLg: 16,
}

export const layout = {
  bottomNavHeight: 64,
  bottomNavInset: 72,
  pageGutter: maquette.containerMargin,
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
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    elevation: 3,
  },
  ambient: {
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    elevation: 4,
  },
}

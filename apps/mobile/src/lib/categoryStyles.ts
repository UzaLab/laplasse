export interface CategoryCircleStyle {
  circleBg: string
  circleBorder: string
  iconColor: string
  labelColor: string
}

const STYLES: Record<string, CategoryCircleStyle> = {
  restaurants: {
    circleBg: '#fffbeb',
    circleBorder: '#fde68a',
    iconColor: '#b45309',
    labelColor: '#78350f',
  },
  'bars-lounges': {
    circleBg: '#f5f3ff',
    circleBorder: '#ddd6fe',
    iconColor: '#6d28d9',
    labelColor: '#4c1d95',
  },
  boutiques: {
    circleBg: '#fff1f2',
    circleBorder: '#fecdd3',
    iconColor: '#be123c',
    labelColor: '#881337',
  },
  'beaute-spa': {
    circleBg: '#fdf4ff',
    circleBorder: '#f5d0fe',
    iconColor: '#a21caf',
    labelColor: '#86198f',
  },
  beaute: {
    circleBg: '#fdf4ff',
    circleBorder: '#f5d0fe',
    iconColor: '#a21caf',
    labelColor: '#86198f',
  },
  'sport-fitness': {
    circleBg: '#ecfdf5',
    circleBorder: '#a7f3d0',
    iconColor: '#047857',
    labelColor: '#064e3b',
  },
  services: {
    circleBg: '#f0f9ff',
    circleBorder: '#bae6fd',
    iconColor: '#0369a1',
    labelColor: '#0c4a6e',
  },
}

const DEFAULT: CategoryCircleStyle = {
  circleBg: '#fffbeb',
  circleBorder: '#fde68a',
  iconColor: '#b45309',
  labelColor: '#475569',
}

export function getCategoryCircleStyle(slug: string): CategoryCircleStyle {
  return STYLES[slug] ?? DEFAULT
}

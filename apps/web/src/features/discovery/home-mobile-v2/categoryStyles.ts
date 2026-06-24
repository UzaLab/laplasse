export interface CategoryCircleStyle {
  circle: string
  icon: string
  label: string
}

const CATEGORY_CIRCLE_STYLES: Record<string, CategoryCircleStyle> = {
  restaurants: {
    circle: 'bg-amber-50 border-amber-200 group-hover:bg-amber-100 group-hover:border-amber-300',
    icon: 'text-amber-700 group-hover:text-amber-800',
    label: 'text-amber-900/80 group-hover:text-amber-900',
  },
  'bars-lounges': {
    circle: 'bg-violet-50 border-violet-200 group-hover:bg-violet-100 group-hover:border-violet-300',
    icon: 'text-violet-700 group-hover:text-violet-800',
    label: 'text-violet-900/80 group-hover:text-violet-900',
  },
  boutiques: {
    circle: 'bg-rose-50 border-rose-200 group-hover:bg-rose-100 group-hover:border-rose-300',
    icon: 'text-rose-700 group-hover:text-rose-800',
    label: 'text-rose-900/80 group-hover:text-rose-900',
  },
  'beaute-spa': {
    circle: 'bg-fuchsia-50 border-fuchsia-200 group-hover:bg-fuchsia-100 group-hover:border-fuchsia-300',
    icon: 'text-fuchsia-700 group-hover:text-fuchsia-800',
    label: 'text-fuchsia-900/80 group-hover:text-fuchsia-900',
  },
  beaute: {
    circle: 'bg-fuchsia-50 border-fuchsia-200 group-hover:bg-fuchsia-100 group-hover:border-fuchsia-300',
    icon: 'text-fuchsia-700 group-hover:text-fuchsia-800',
    label: 'text-fuchsia-900/80 group-hover:text-fuchsia-900',
  },
  'sport-fitness': {
    circle: 'bg-emerald-50 border-emerald-200 group-hover:bg-emerald-100 group-hover:border-emerald-300',
    icon: 'text-emerald-700 group-hover:text-emerald-800',
    label: 'text-emerald-900/80 group-hover:text-emerald-900',
  },
  services: {
    circle: 'bg-sky-50 border-sky-200 group-hover:bg-sky-100 group-hover:border-sky-300',
    icon: 'text-sky-700 group-hover:text-sky-800',
    label: 'text-sky-900/80 group-hover:text-sky-900',
  },
}

const DEFAULT_CATEGORY_STYLE: CategoryCircleStyle = {
  circle: 'bg-brand-50 border-brand-200 group-hover:bg-brand-100 group-hover:border-brand-300',
  icon: 'text-brand-700 group-hover:text-brand-800',
  label: 'text-slate-600 group-hover:text-brand-800',
}

export function getCategoryCircleStyle(slug: string): CategoryCircleStyle {
  return CATEGORY_CIRCLE_STYLES[slug] ?? DEFAULT_CATEGORY_STYLE
}

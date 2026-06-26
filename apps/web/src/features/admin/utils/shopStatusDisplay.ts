export const SHOP_STATUS_BADGE: Record<string, string> = {
  PENDING_REVIEW: 'bg-amber-50 text-amber-700 border border-amber-200',
  ACTIVE: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  SUSPENDED: 'bg-red-50 text-red-700 border border-red-200',
  DRAFT: 'bg-slate-50 text-slate-500 border border-slate-200',
}

export const SHOP_STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW: 'En validation',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspendue',
  DRAFT: 'Brouillon',
}

export function shopStatusBadgeClass(status: string): string {
  return SHOP_STATUS_BADGE[status] ?? SHOP_STATUS_BADGE.DRAFT
}

export function shopStatusLabel(status: string): string {
  return SHOP_STATUS_LABELS[status] ?? status
}

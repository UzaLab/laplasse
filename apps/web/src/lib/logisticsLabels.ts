export type PartnerVerification = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED'

export const PARTNER_VERIFICATION_LABELS: Record<string, string> = {
  UNVERIFIED: 'Non vérifié',
  PENDING: 'En attente KYC',
  VERIFIED: 'Structure vérifiée',
  REJECTED: 'Demande refusée',
}

export const PARTNER_VERIFICATION_STYLES: Record<string, string> = {
  UNVERIFIED: 'bg-slate-50 text-slate-600 border-slate-200',
  PENDING: 'bg-amber-50 text-amber-800 border-amber-200',
  VERIFIED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-800 border-red-200',
}

/** Plus grosse coupure XOF en circulation (BCEAO). */
export const XOF_MAX_BILL = 10_000

/** Montants de billets proposés au client (multiples de 10 000 FCFA). */
export function cashTenderOptions(orderTotal: number, maxOptions = 8): number[] {
  const safeTotal = Math.max(0, Math.ceil(orderTotal))
  if (safeTotal === 0) return [XOF_MAX_BILL]
  const minBills = Math.max(1, Math.ceil(safeTotal / XOF_MAX_BILL))
  const options: number[] = []
  for (let bills = minBills; bills <= minBills + maxOptions - 1; bills++) {
    options.push(bills * XOF_MAX_BILL)
  }
  return options
}

export function formatCashTenderLabel(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} FCFA`
}

export function cashChangeDue(tenderAmount: number, orderTotal: number): number {
  return Math.max(0, tenderAmount - orderTotal)
}

export function courierCashTenderMessage(
  total: number,
  exact: boolean | null | undefined,
  tenderAmount: number | null | undefined,
): string | null {
  if (exact) {
    return `Cash : montant exact ${total.toLocaleString('fr-FR')} FCFA`
  }
  if (tenderAmount != null && tenderAmount > 0) {
    const change = cashChangeDue(tenderAmount, total)
    return `Cash : client paie ${tenderAmount.toLocaleString('fr-FR')} FCFA — rendre ${change.toLocaleString('fr-FR')} FCFA`
  }
  return null
}

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

export const XOF_MAX_BILL = 10_000

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

export function cashChangeDue(tenderAmount: number, orderTotal: number): number {
  return Math.max(0, tenderAmount - orderTotal)
}

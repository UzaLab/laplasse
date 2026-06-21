/** Derniers chiffres significatifs pour rapprocher guest_phone et User.phone. */
export function phoneMatchTail(phone: string): string | null {
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 8) return null
  return digits.slice(-8)
}

export function phonesLikelyMatch(a: string, b: string): boolean {
  const tailA = phoneMatchTail(a)
  const tailB = phoneMatchTail(b)
  if (!tailA || !tailB) return false
  return tailA === tailB
}

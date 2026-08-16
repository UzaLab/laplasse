import type { AuthUser } from '@laplasse/api-client'

export function getCourierInitials(user: AuthUser | null | undefined): string {
  return (user?.full_name ?? user?.email ?? '?')
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase() ?? '')
    .join('')
}

/** Avatar URL: user photo, then KYC document if uploaded during onboarding. */
export function getCourierAvatarUrl(user: AuthUser | null | undefined): string | null {
  if (!user) return null
  if (user.avatar?.trim()) return user.avatar.trim()
  const kycUrl = user.courier_profile?.id_document_url
  if (kycUrl?.trim()) return kycUrl.trim()
  return null
}

/** Extrait le texte brut d'un fragment HTML (aperçus, meta). */
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export function hasHtmlContent(html?: string | null): boolean {
  if (!html?.trim()) return false
  return stripHtml(html).length > 0
}

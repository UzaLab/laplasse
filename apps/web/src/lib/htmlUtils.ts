/** Extrait le texte brut d'un fragment HTML (aperçus, meta). */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Vérifie si le HTML contient du contenu visible. */
export function hasHtmlContent(html?: string | null): boolean {
  if (!html?.trim()) return false
  return stripHtml(html).length > 0
}

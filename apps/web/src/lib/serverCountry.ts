/**
 * Résolution du pays côté serveur (Server Components / Route Handlers).
 *
 * Lit l'header `X-LaPlasse-Country` injecté par le middleware Edge,
 * qui a déjà résolu la priorité : sous-domaine > cookie > défaut.
 *
 * Usage :
 *   const country = await getRequestCountry()
 */

import { headers } from 'next/headers'
import { DEFAULT_COUNTRY, COUNTRY_HEADER, getDefaultCity } from './country'

export async function getRequestCountry(): Promise<string> {
  try {
    const h = await headers()
    const raw = h.get(COUNTRY_HEADER)?.trim().toUpperCase()
    if (raw && /^[A-Z]{2}$/.test(raw)) return raw
  } catch {
    // En dehors d'un contexte de requête (build statique, etc.)
  }
  return DEFAULT_COUNTRY
}

/** Raccourci : pays + ville par défaut pour ce pays */
export async function getRequestCountryAndCity(): Promise<{ country: string; city: string }> {
  const country = await getRequestCountry()
  const city = getDefaultCity(country)
  return { country, city }
}

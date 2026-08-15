import type { Router } from 'expo-router'

/** Évite l'erreur GO_BACK quand l'écran a été ouvert directement (deep link, refresh web). */
export function goBackOrReplace(router: Router, fallbackPath: string) {
  if (router.canGoBack()) {
    router.back()
    return
  }
  router.replace(fallbackPath as never)
}

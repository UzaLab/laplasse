export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
}

export function isIosSafari(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  return /iPad|iPhone|iPod/.test(ua) && !(window as Window & { MSStream?: unknown }).MSStream
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null

  try {
    return await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
  } catch {
    return null
  }
}

export function onServiceWorkerUpdate(onUpdate: () => void): () => void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return () => {}

  const handler = () => {
    navigator.serviceWorker.getRegistration().then(reg => {
      if (!reg) return
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing
        if (!worker) return
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            onUpdate()
          }
        })
      })
    })
  }

  handler()
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload()
  })

  return () => {}
}

export async function activateWaitingServiceWorker(): Promise<void> {
  const reg = await navigator.serviceWorker.getRegistration()
  reg?.waiting?.postMessage({ type: 'SKIP_WAITING' })
}

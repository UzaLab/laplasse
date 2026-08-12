import { useToastStore, type ToastType } from '@/src/stores/toastStore'

function push(type: ToastType, message: string, description?: string) {
  useToastStore.getState().show(type, message, description)
}

export const notify = {
  success: (message: string, description?: string) => push('success', message, description),
  error: (message: string, description?: string) => push('error', message, description),
  info: (message: string, description?: string) => push('info', message, description),
  warning: (message: string, description?: string) => push('warning', message, description),
}

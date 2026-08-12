import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  description?: string
}

interface ToastState {
  toasts: ToastItem[]
  show: (type: ToastType, message: string, description?: string) => void
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  show(type, message, description) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    set({ toasts: [...get().toasts, { id, type, message, description }] })
    setTimeout(() => get().dismiss(id), 4500)
  },
  dismiss(id) {
    set({ toasts: get().toasts.filter(t => t.id !== id) })
  },
}))

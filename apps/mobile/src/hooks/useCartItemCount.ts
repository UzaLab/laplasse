import { useCartStore } from '@/src/stores/cartStore'

export function useCartItemCount(): number {
  return useCartStore(s => s.cart?.item_count ?? 0)
}

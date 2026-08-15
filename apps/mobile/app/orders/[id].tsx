import { useLocalSearchParams } from 'expo-router'
import { OrderDetailView } from '@/src/screens/OrderDetailView'

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <OrderDetailView orderId={String(id ?? '')} />
}

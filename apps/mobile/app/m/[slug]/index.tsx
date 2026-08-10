import { useLocalSearchParams } from 'expo-router'
import { MerchantDetailView } from '@/src/screens/MerchantDetailView'

export default function MerchantScreen() {
  const { slug, tab } = useLocalSearchParams<{ slug: string; tab?: string }>()
  return <MerchantDetailView slug={String(slug)} initialTab={tab} />
}

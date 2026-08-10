import { useLocalSearchParams } from 'expo-router'
import { BoutiqueView } from '@/src/screens/BoutiqueView'

export default function BoutiqueScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  return <BoutiqueView slug={String(slug)} />
}

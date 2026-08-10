import { useLocalSearchParams } from 'expo-router'
import { RestaurationDetailView } from '@/src/screens/RestaurationDetailView'

export default function RestaurationDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  if (!slug) return null
  return <RestaurationDetailView slug={slug} />
}

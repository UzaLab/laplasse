import { useLocalSearchParams } from 'expo-router'
import { RestaurationHubView } from '@/src/screens/RestaurationHubView'

export default function RestaurationScreen() {
  const params = useLocalSearchParams<{ cat?: string; q?: string }>()
  return (
    <RestaurationHubView
      initialCategory={params.cat ?? ''}
      initialQuery={params.q ?? ''}
    />
  )
}

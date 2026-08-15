import { useLocalSearchParams } from 'expo-router'
import { RoomDetailView } from '@/src/screens/RoomDetailView'

export default function RoomDetailScreen() {
  const { slug, roomSlug } = useLocalSearchParams<{ slug: string; roomSlug: string }>()

  return (
    <RoomDetailView
      merchantSlug={String(slug ?? '')}
      roomSlug={String(roomSlug ?? '')}
    />
  )
}

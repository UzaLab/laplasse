import type { MissionMapProps } from '@/src/components/MissionMap'
import { MissionMapOsmWeb } from '@/src/components/MissionMapOsmWeb'

/** Android/iOS — carte OSM WebView (évite crash react-native-maps sans clé Google SDK). */
export function MissionMap(props: MissionMapProps) {
  return <MissionMapOsmWeb {...props} />
}

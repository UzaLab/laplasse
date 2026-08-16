import type { ComponentType } from 'react'

export type MissionMapProps = {
  pickupLabel?: string | null
  dropoffLabel?: string | null
  courierLat?: number | null
  courierLng?: number | null
}

const isWeb = process.env.EXPO_OS === 'web'

export function MissionMap(props: MissionMapProps) {
  const Impl: ComponentType<MissionMapProps> = isWeb
    ? require('./MissionMap.web').MissionMap
    : require('./MissionMap.native').MissionMap

  return <Impl {...props} />
}

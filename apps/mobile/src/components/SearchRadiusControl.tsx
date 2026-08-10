import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { GeoStatus, UserCoordinates } from '@/src/hooks/useSearchMobileNearby'
import { colors, fonts } from '@/src/theme'

interface SearchRadiusControlProps {
  radiusKm: number
  minRadiusKm: number
  maxRadiusKm: number
  onRadiusChange: (km: number) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  userLocation: UserCoordinates | null
  geoStatus: GeoStatus
  onRequestGeolocation: () => void
  loadingMerchants?: boolean
}

export function SearchRadiusControl({
  radiusKm,
  minRadiusKm,
  maxRadiusKm,
  onRadiusChange,
  open,
  onOpenChange,
  userLocation,
  geoStatus,
  onRequestGeolocation,
  loadingMerchants = false,
}: SearchRadiusControlProps) {
  const showRadiusControl = geoStatus === 'granted' && userLocation
  const showLocateButton = geoStatus === 'denied' || geoStatus === 'unsupported'

  if (!showRadiusControl && !showLocateButton && geoStatus !== 'loading') {
    return null
  }

  const handleMainPress = () => {
    if (showLocateButton) {
      void onRequestGeolocation()
      return
    }
    onOpenChange(!open)
  }

  return (
    <View style={styles.wrap}>
      {open && showRadiusControl ? (
        <View style={styles.panel}>
          <Text style={styles.panelLabel}>{maxRadiusKm} km</Text>
          <View style={styles.stepper}>
            <Pressable
              onPress={() => onRadiusChange(Math.max(minRadiusKm, radiusKm - 1))}
              style={styles.stepBtn}
              accessibilityLabel="Réduire le rayon"
            >
              <Ionicons name="remove" size={18} color={colors.text} />
            </Pressable>
            <Text style={styles.radiusValue}>{radiusKm} km</Text>
            <Pressable
              onPress={() => onRadiusChange(Math.min(maxRadiusKm, radiusKm + 1))}
              style={styles.stepBtn}
              accessibilityLabel="Augmenter le rayon"
            >
              <Ionicons name="add" size={18} color={colors.text} />
            </Pressable>
          </View>
          <Text style={styles.panelLabel}>{minRadiusKm} km</Text>
          {loadingMerchants ? (
            <ActivityIndicator size="small" color={colors.brand500} style={styles.loader} />
          ) : null}
        </View>
      ) : null}

      <Pressable
        onPress={handleMainPress}
        style={[styles.mainBtn, open && showRadiusControl && styles.mainBtnOpen]}
        accessibilityLabel={
          showLocateButton
            ? 'Activer la localisation'
            : open
              ? 'Fermer le réglage du rayon'
              : `Rayon de recherche : ${radiusKm} km`
        }
      >
        {geoStatus === 'loading' ? (
          <ActivityIndicator size="small" color={colors.brand500} />
        ) : showLocateButton ? (
          <Ionicons name="locate" size={20} color={colors.brand600} />
        ) : (
          <Ionicons name="radio-outline" size={20} color={colors.brand600} />
        )}
        {showRadiusControl && !open ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{radiusKm}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'flex-end' },
  panel: {
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 8,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  panelLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radiusValue: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.brand700,
    backgroundColor: colors.brand50,
    borderWidth: 1,
    borderColor: colors.brand100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    minWidth: 56,
    textAlign: 'center',
  },
  loader: { marginTop: 4 },
  mainBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mainBtnOpen: {
    borderColor: colors.brand200,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.brand600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: '#fff',
  },
})

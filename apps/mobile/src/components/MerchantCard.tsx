import { StyleSheet, Text, View } from 'react-native'
import type { ApiMerchant } from '@laplasse/api-client'
import { AppImage } from '@/src/components/ui/AppImage'
import { Card } from '@/src/components/ui'
import { colors, fonts } from '@/src/theme'

export function MerchantCard({
  merchant,
  onPress,
}: {
  merchant: ApiMerchant
  onPress: () => void
}) {
  return (
    <Card onPress={onPress}>
      <View style={styles.row}>
        {merchant.logo ? (
          <AppImage uri={merchant.logo} style={styles.logo} fallbackLetter={merchant.business_name.slice(0, 1)} />
        ) : (
          <View style={[styles.logo, styles.logoFallback]}>
            <Text style={styles.logoText}>{merchant.business_name.slice(0, 1)}</Text>
          </View>
        )}
        <View style={styles.content}>
          <Text style={styles.name}>{merchant.business_name}</Text>
          <Text style={styles.meta}>
            {merchant.category.name}
            {merchant.location?.district ? ` · ${merchant.location.district}` : ''}
          </Text>
          {merchant.distance_km != null ? (
            <Text style={styles.distance}>{merchant.distance_km.toFixed(1)} km</Text>
          ) : null}
        </View>
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  logo: { width: 56, height: 56, borderRadius: 12 },
  logoFallback: {
    backgroundColor: colors.brand600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: '#fff', fontFamily: fonts.extrabold, fontSize: 22 },
  content: { flex: 1 },
  name: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
  meta: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 4 },
  distance: { fontFamily: fonts.semibold, fontSize: 12, color: colors.brand700, marginTop: 4 },
})

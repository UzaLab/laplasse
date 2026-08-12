import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { openWhatsApp } from '@/src/lib/whatsapp'
import { colors, fonts, homeLayout, radii } from '@/src/theme'

interface Props {
  prestationsLabel?: string
  bookingCta?: string
  whatsapp?: string | null
  phone?: string | null
  onPrestations: () => void
  onReserver: () => void
}

export function ServiceBottomActionBar({
  prestationsLabel = 'Prestations',
  bookingCta = 'Prendre RDV',
  whatsapp,
  phone,
  onPrestations,
  onReserver,
}: Props) {
  const insets = useSafeAreaInsets()
  const contact = whatsapp ?? phone

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {contact ? (
        <Pressable
          style={styles.chatBtn}
          onPress={() =>
            whatsapp
              ? openWhatsApp(whatsapp, `Bonjour, je souhaite réserver via LaPlasse.`)
              : undefined
          }
          accessibilityLabel="WhatsApp"
        >
          <Ionicons name="logo-whatsapp" size={22} color="#fff" />
        </Pressable>
      ) : null}

      <View style={styles.actions}>
        <Pressable onPress={onPrestations} style={styles.secondaryBtn}>
          <Ionicons name="list-outline" size={18} color={colors.text} />
          <Text style={styles.secondaryText} numberOfLines={1}>{prestationsLabel}</Text>
        </Pressable>
        <Pressable onPress={onReserver} style={styles.primaryBtn}>
          <Ionicons name="calendar-outline" size={18} color="#fff" />
          <Text style={styles.primaryText} numberOfLines={1}>{bookingCta}</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderTopWidth: 1,
    borderTopColor: colors.borderStrong,
    borderTopLeftRadius: homeLayout.radiusXl,
    borderTopRightRadius: homeLayout.radiusXl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  chatBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  actions: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'stretch', gap: 8 },
  secondaryBtn: {
    flex: 1,
    flexBasis: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  secondaryText: { fontFamily: fonts.bold, fontSize: 13, color: colors.text },
  primaryBtn: {
    flex: 1,
    flexBasis: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: radii.button,
    backgroundColor: colors.slate900,
  },
  primaryText: { fontFamily: fonts.bold, fontSize: 13, color: '#fff' },
})

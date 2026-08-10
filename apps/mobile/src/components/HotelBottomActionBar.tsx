import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { openWhatsApp } from '@/src/lib/whatsapp'
import { colors, fonts, radii } from '@/src/theme'

interface Props {
  categorySlug: string
  bookingCta?: string
  whatsapp?: string | null
  phone?: string | null
  onChambres: () => void
  onReserver: () => void
}

export function HotelBottomActionBar({
  categorySlug,
  bookingCta = 'Réserver',
  whatsapp,
  phone,
  onChambres,
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
          <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
        </Pressable>
      ) : null}

      <View style={styles.actions}>
        <Pressable onPress={onChambres} style={styles.secondaryBtn}>
          <Ionicons name="bed-outline" size={18} color={colors.text} />
          <Text style={styles.secondaryText}>
            {categorySlug === 'residences' ? 'Logements' : 'Chambres'}
          </Text>
        </Pressable>
        <Pressable onPress={onReserver} style={styles.primaryBtn}>
          <Ionicons name="calendar-outline" size={18} color="#fff" />
          <Text style={styles.primaryText}>{bookingCta}</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 1,
    borderTopColor: colors.borderStrong,
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
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actions: { flex: 1, flexDirection: 'row', gap: 8 },
  secondaryBtn: {
    flex: 1,
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

import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { openWhatsApp } from '@/src/lib/whatsapp'
import { colors, fonts, homeLayout } from '@/src/theme'

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
          <Ionicons name="logo-whatsapp" size={24} color="#fff" />
        </Pressable>
      ) : null}

      <Pressable onPress={onPrestations} style={styles.secondaryBtn}>
        <Ionicons name="list-outline" size={20} color={colors.text} />
        <Text style={styles.secondaryText}>{prestationsLabel}</Text>
      </Pressable>

      <Pressable onPress={onReserver} style={styles.primaryBtn}>
        <Ionicons name="calendar-outline" size={18} color="#fff" />
        <Text style={styles.primaryText}>{bookingCta}</Text>
      </Pressable>
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
    gap: 10,
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
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minWidth: 64,
    paddingHorizontal: 4,
  },
  secondaryText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    color: colors.text,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.slate900,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: homeLayout.radiusLg,
    maxWidth: 220,
    marginLeft: 'auto',
  },
  primaryText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: '#fff',
  },
})

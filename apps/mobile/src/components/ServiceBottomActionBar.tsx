import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { openWhatsApp } from '@/src/lib/whatsapp'
import { colors, fonts } from '@/src/theme'

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
  const contact = whatsapp ?? phone

  return (
    <View style={styles.outer}>
      <View style={styles.wrap}>
        {contact ? (
          <Pressable
            style={styles.chatBtn}
            onPress={() => {
              if (whatsapp) {
                openWhatsApp(whatsapp, 'Bonjour, je souhaite réserver via LaPlasse.')
              } else if (phone) {
                void Linking.openURL(`tel:${phone}`)
              }
            }}
            accessibilityLabel="WhatsApp"
          >
            <Ionicons name="logo-whatsapp" size={24} color="#fff" />
          </Pressable>
        ) : null}

        <Pressable onPress={onPrestations} style={styles.prestationsBtn}>
          <Ionicons name="list-outline" size={18} color={colors.text} />
          <Text style={styles.prestationsText} numberOfLines={1}>{prestationsLabel}</Text>
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
  outer: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  chatBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  prestationsBtn: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    flexShrink: 0,
  },
  prestationsText: {
    fontFamily: fonts.semibold,
    fontSize: 10,
    color: colors.text,
    textAlign: 'center',
  },
  primaryBtn: {
    flex: 1,
    minWidth: 0,
    maxWidth: 200,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.slate900,
    marginLeft: 'auto',
  },
  primaryText: { fontFamily: fonts.bold, fontSize: 14, color: '#fff' },
})

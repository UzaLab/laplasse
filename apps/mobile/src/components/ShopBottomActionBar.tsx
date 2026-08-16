import { Linking, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { openWhatsApp } from '@/src/lib/whatsapp'
import { colors, fonts } from '@/src/theme'

interface Props {
  whatsapp?: string | null
  phone?: string | null
  onBoutique: () => void
  onScrollTop: () => void
}

export function ShopBottomActionBar({
  whatsapp,
  phone,
  onBoutique,
  onScrollTop,
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
                openWhatsApp(whatsapp, 'Bonjour, je souhaite commander via LaPlasse.')
              } else if (phone) {
                void Linking.openURL(`tel:${phone}`)
              }
            }}
            accessibilityLabel="WhatsApp"
          >
            <Ionicons name="logo-whatsapp" size={24} color="#fff" />
          </Pressable>
        ) : null}

        <Pressable onPress={onBoutique} style={styles.boutiqueBtn}>
          <Ionicons name="storefront-outline" size={18} color="#fff" />
          <Text style={styles.boutiqueText}>Boutique</Text>
        </Pressable>

        <Pressable onPress={onScrollTop} style={styles.topBtn} accessibilityLabel="Retour en haut">
          <Ionicons name="arrow-up" size={20} color={colors.text} />
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
  boutiqueBtn: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#131b2e',
  },
  boutiqueText: { fontFamily: fonts.bold, fontSize: 14, color: '#fff' },
  topBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
})

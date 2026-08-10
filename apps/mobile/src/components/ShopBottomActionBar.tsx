import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { openWhatsApp } from '@/src/lib/whatsapp'
import { colors, fonts, radii } from '@/src/theme'

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
  const insets = useSafeAreaInsets()
  const contact = whatsapp ?? phone

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      {contact ? (
        <Pressable
          style={styles.chatBtn}
          onPress={() =>
            whatsapp
              ? openWhatsApp(whatsapp, 'Bonjour, je souhaite commander via LaPlasse.')
              : undefined
          }
          accessibilityLabel="WhatsApp"
        >
          <Ionicons name="chatbubble-ellipses" size={22} color="#fff" />
        </Pressable>
      ) : null}

      <Pressable onPress={onBoutique} style={styles.boutiqueBtn}>
        <Ionicons name="storefront-outline" size={18} color="#fff" />
        <Text style={styles.boutiqueText}>Boutique</Text>
      </Pressable>

      <Pressable onPress={onScrollTop} style={styles.topBtn} accessibilityLabel="Retour en haut">
        <Ionicons name="arrow-up" size={22} color={colors.text} />
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
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: 'rgba(249,249,249,0.96)',
    borderTopWidth: 1,
    borderTopColor: colors.borderStrong,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
  },
  chatBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  boutiqueBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: radii.button,
    backgroundColor: '#131b2e',
  },
  boutiqueText: { fontFamily: fonts.semibold, fontSize: 15, color: '#fff' },
  topBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
})

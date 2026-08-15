import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { SearchAutocomplete } from '@/src/components/SearchAutocomplete'
import { colors, fonts, spacing } from '@/src/theme'

export function FullscreenSearchModal({
  visible,
  onClose,
}: {
  visible: boolean
  onClose: () => void
}) {
  const insets = useSafeAreaInsets()

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn} accessibilityLabel="Fermer">
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Rechercher</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.body}>
          <SearchAutocomplete
            appearance="fullscreen"
            autoFocus
            placeholder="Établissements, plats, boutiques, produits…"
            onSubmit={() => onClose()}
          />
          <Text style={styles.hint}>
            Recherche Meilisearch — établissements, menus restaurant, boutiques et produits marketplace.
          </Text>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surfaceBright,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.gutter,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fonts.extrabold,
    fontSize: 17,
    color: colors.text,
  },
  headerSpacer: { width: 40 },
  body: {
    flex: 1,
    paddingHorizontal: spacing.gutter,
    gap: 12,
  },
  hint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
    paddingHorizontal: 4,
  },
})

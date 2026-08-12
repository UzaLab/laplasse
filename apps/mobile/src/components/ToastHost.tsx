import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useToastStore, type ToastItem, type ToastType } from '@/src/stores/toastStore'
import { colors, fonts, homeLayout } from '@/src/theme'

const ICON: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'close-circle',
  info: 'information-circle',
  warning: 'warning',
}

const PALETTE: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
  success: { bg: '#ecfdf5', border: '#a7f3d0', icon: colors.emerald700, text: '#065f46' },
  error: { bg: '#fef2f2', border: '#fecaca', icon: colors.danger, text: '#991b1b' },
  info: { bg: '#eff6ff', border: '#bfdbfe', icon: '#2563eb', text: '#1e3a8a' },
  warning: { bg: '#fffbeb', border: '#fde68a', icon: colors.brand600, text: '#92400e' },
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const palette = PALETTE[toast.type]
  return (
    <Pressable onPress={onDismiss} style={[styles.card, { backgroundColor: palette.bg, borderColor: palette.border }]}>
      <Ionicons name={ICON[toast.type]} size={22} color={palette.icon} />
      <View style={styles.body}>
        <Text style={[styles.message, { color: palette.text }]}>{toast.message}</Text>
        {toast.description ? (
          <Text style={[styles.description, { color: palette.text }]}>{toast.description}</Text>
        ) : null}
      </View>
    </Pressable>
  )
}

export function ToastHost() {
  const insets = useSafeAreaInsets()
  const toasts = useToastStore(s => s.toasts)
  const dismiss = useToastStore(s => s.dismiss)

  if (toasts.length === 0) return null

  return (
    <View pointerEvents="box-none" style={[styles.host, { top: insets.top + 8 }]}>
      {toasts.map(toast => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    gap: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: homeLayout.radiusLg,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 6,
  },
  body: { flex: 1, gap: 2 },
  message: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 20 },
  description: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, opacity: 0.9 },
})

import { ScrollView, StyleSheet } from 'react-native'
import { CourierPageHeader, CourierShell } from '@/src/components/CourierShell'
import { CourierZonesEditor } from '@/src/components/CourierZonesEditor'
import { LoadingState } from '@/src/components/ui'
import { useAuthStore } from '@/src/stores/authStore'
import { layout } from '@/src/theme'

export default function CourierZonesScreen() {
  const profile = useAuthStore(s => s.user?.courier_profile)

  if (!profile) {
    return (
      <CourierShell>
        <LoadingState />
      </CourierShell>
    )
  }

  return (
    <CourierShell>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <CourierPageHeader
          title="Zones de service"
          subtitle="Choisissez où vous acceptez des livraisons — données alignées sur le référentiel geo LaPlasse."
        />
        <CourierZonesEditor profileCity={profile.city} profileCountry={profile.country} />
      </ScrollView>
    </CourierShell>
  )
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: layout.pageGutter,
    paddingTop: 8,
    paddingBottom: layout.bottomNavInset + 24,
    gap: 20,
  },
})

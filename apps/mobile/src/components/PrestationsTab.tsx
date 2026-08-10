import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatPrice } from '@laplasse/shared-config'
import type { MerchantServiceConfig } from '@laplasse/api-client'
import { getApiClient } from '@/src/lib/api'
import { colors, fonts, homeLayout } from '@/src/theme'

function durationLabel(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`
}

export function PrestationsTab({
  merchantId,
  merchantSlug,
  categorySlug,
}: {
  merchantId: string
  merchantSlug: string
  categorySlug: string
}) {
  const isPharmacy = categorySlug === 'pharmacies'
  const targetKind = isPharmacy ? 'CONSULTATION' : 'APPOINTMENT'
  const label = isPharmacy ? 'consultations' : 'prestations'

  const [selectedId, setSelectedId] = useState<string | null>(null)

  const configQuery = useQuery({
    queryKey: ['booking-config', merchantId],
    queryFn: () => getApiClient().getMerchantBookingConfig(merchantId),
  })

  const services: MerchantServiceConfig[] = (configQuery.data?.services ?? []).filter(
    s => !s.service_kind || s.service_kind === targetKind,
  )

  const selected = services.find(s => s.id === selectedId) ?? services[0] ?? null

  const handleBook = () => {
    if (!selected) return
    const url = `https://laplasse.ci/m/${merchantSlug}?tab=prestations&serviceId=${selected.id}`
    void Linking.openURL(url).catch(() =>
      Alert.alert('Réservation', 'Visitez la page de l\'établissement pour réserver.'),
    )
  }

  if (configQuery.isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.brand500} />
      </View>
    )
  }

  if (services.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="sparkles-outline" size={40} color={colors.brand200} />
        <Text style={styles.emptyTitle}>
          {isPharmacy ? 'Consultations à venir' : 'Prestations à venir'}
        </Text>
        <Text style={styles.emptyBody}>
          Réservez directement via la page de l&apos;établissement.
        </Text>
        <Pressable
          onPress={() => void Linking.openURL(`https://laplasse.ci/m/${merchantSlug}?tab=prestations`)}
          style={styles.emptyBtn}
        >
          <Text style={styles.emptyBtnText}>Voir les disponibilités</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      {configQuery.data?.booking_settings?.cancellation_policy ? (
        <View style={styles.policyBox}>
          <Ionicons name="information-circle-outline" size={16} color={colors.brand700} />
          <Text style={styles.policyText}>
            {configQuery.data.booking_settings.cancellation_policy}
          </Text>
        </View>
      ) : null}

      {services.map(service => {
        const active = selected?.id === service.id
        return (
          <Pressable
            key={service.id}
            onPress={() => setSelectedId(service.id)}
            style={[styles.serviceCard, active && styles.serviceCardActive]}
          >
            <View style={styles.serviceRow}>
              <View style={styles.serviceInfo}>
                <Text style={styles.serviceName}>{service.name}</Text>
                {service.description ? (
                  <Text style={styles.serviceDesc} numberOfLines={2}>{service.description}</Text>
                ) : null}
                <View style={styles.serviceMeta}>
                  {service.duration_min > 0 ? (
                    <View style={styles.metaChip}>
                      <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                      <Text style={styles.metaText}>{durationLabel(service.duration_min)}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <View style={styles.servicePrice}>
                {service.price ? (
                  <Text style={styles.priceText}>{formatPrice(service.price, 'XOF')}</Text>
                ) : (
                  <Text style={styles.priceText}>Sur devis</Text>
                )}
                <View style={[styles.radioCircle, active && styles.radioCircleActive]} />
              </View>
            </View>
          </Pressable>
        )
      })}

      <Pressable onPress={handleBook} style={styles.bookBtn}>
        <Ionicons name="calendar-outline" size={18} color="#fff" />
        <Text style={styles.bookBtnText}>
          Réserver {selected ? `— ${selected.name}` : ''}
        </Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  loading: { padding: 32, alignItems: 'center' },
  empty: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: homeLayout.radiusXl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: { fontFamily: fonts.bold, fontSize: 16, color: colors.text, textAlign: 'center' },
  emptyBody: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: colors.slate900,
    marginTop: 8,
  },
  emptyBtnText: { fontFamily: fonts.bold, fontSize: 14, color: '#fff' },
  policyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.brand50,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.brand100,
  },
  policyText: { fontFamily: fonts.regular, fontSize: 13, color: colors.text, flex: 1, lineHeight: 18 },
  serviceCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceCardActive: { borderColor: colors.brand500, backgroundColor: colors.brand50 },
  serviceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  serviceInfo: { flex: 1 },
  serviceName: { fontFamily: fonts.bold, fontSize: 15, color: colors.text },
  serviceDesc: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 18 },
  serviceMeta: { flexDirection: 'row', gap: 8, marginTop: 8 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  servicePrice: { alignItems: 'flex-end', gap: 8 },
  priceText: { fontFamily: fonts.bold, fontSize: 14, color: colors.brand700 },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderStrong,
  },
  radioCircleActive: { borderColor: colors.brand500, backgroundColor: colors.brand500 },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.slate900,
    borderRadius: 999,
    paddingVertical: 16,
    marginTop: 4,
  },
  bookBtnText: { fontFamily: fonts.extrabold, fontSize: 15, color: '#fff' },
})

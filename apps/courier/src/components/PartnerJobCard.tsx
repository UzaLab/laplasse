import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { PartnerDeliveryJob, PartnerFleetCourier } from '@laplasse/api-client'
import { Ionicons } from '@expo/vector-icons'
import { Card, PrimaryButton } from '@/src/components/ui'
import { formatFcfa } from '@/src/lib/labels'
import { JOB_STATUS_LABELS } from '@/src/lib/jobLabels'
import { colors, fonts } from '@/src/theme'

export function PartnerJobCard({
  job,
  fleet,
  onAssign,
  loading,
}: {
  job: PartnerDeliveryJob
  fleet: PartnerFleetCourier[]
  onAssign: (jobId: string, courierId: string) => Promise<void>
  loading?: boolean
}) {
  const [selectedCourier, setSelectedCourier] = useState<string | null>(null)
  const onlineCouriers = fleet.filter(c => c.status === 'ACTIVE' && c.is_online)

  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.shop}>{job.order.shop?.name ?? 'Commande'}</Text>
        <Text style={styles.status}>{JOB_STATUS_LABELS[job.status as keyof typeof JOB_STATUS_LABELS] ?? job.status}</Text>
      </View>
      <Text style={styles.address} numberOfLines={2}>
        {job.dropoff_address ?? job.order.delivery_address ?? 'Adresse client'}
      </Text>
      {job.order.delivery_fee != null ? (
        <Text style={styles.fee}>{formatFcfa(job.order.delivery_fee)}</Text>
      ) : null}

      {job.courier_profile ? (
        <View style={styles.assigned}>
          <Ionicons name="bicycle-outline" size={16} color={colors.emerald700} />
          <Text style={styles.assignedText}>
            {job.courier_profile.user.full_name ?? job.courier_profile.phone ?? 'Livreur assigné'}
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.assignLabel}>Assigner à un livreur en ligne</Text>
          <View style={styles.fleetList}>
            {onlineCouriers.length === 0 ? (
              <Text style={styles.noFleet}>Aucun livreur en ligne</Text>
            ) : (
              onlineCouriers.map(c => (
                <Pressable
                  key={c.id}
                  onPress={() => setSelectedCourier(c.id)}
                  style={[styles.fleetChip, selectedCourier === c.id && styles.fleetChipActive]}
                >
                  <Text style={[styles.fleetChipText, selectedCourier === c.id && styles.fleetChipTextActive]}>
                    {c.user.full_name ?? c.phone}
                  </Text>
                </Pressable>
              ))
            )}
          </View>
          {selectedCourier ? (
            <PrimaryButton
              label="Confirmer l'assignation"
              loading={loading}
              variant="partner"
              onPress={() => void onAssign(job.id, selectedCourier)}
            />
          ) : null}
        </>
      )}
    </Card>
  )
}

export function FleetCourierRow({ courier }: { courier: PartnerFleetCourier }) {
  return (
    <Card>
      <View style={styles.header}>
        <Text style={styles.shop}>{courier.user.full_name ?? 'Livreur'}</Text>
        <View style={[styles.dot, courier.is_online && styles.dotOnline]} />
      </View>
      <Text style={styles.address}>{courier.phone} · {courier.city}</Text>
      <Text style={styles.fee}>
        {courier.stats_90d.delivered_jobs}/{courier.stats_90d.total_jobs} livraisons · {courier.rating_avg.toFixed(1)} ★
      </Text>
    </Card>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  shop: { flex: 1, fontFamily: fonts.bold, fontSize: 16, color: colors.text },
  status: { fontFamily: fonts.semibold, fontSize: 12, color: colors.partnerAccent },
  address: { marginTop: 8, fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  fee: { marginTop: 8, fontFamily: fonts.bold, fontSize: 15, color: colors.emerald700 },
  assigned: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  assignedText: { fontFamily: fonts.medium, fontSize: 14, color: colors.emerald700 },
  assignLabel: { marginTop: 12, fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  fleetList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 12 },
  fleetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  fleetChipActive: { borderColor: colors.partnerAccent, backgroundColor: '#e0f2fe' },
  fleetChipText: { fontFamily: fonts.medium, fontSize: 13, color: colors.text },
  fleetChipTextActive: { color: colors.partnerAccent },
  noFleet: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.borderStrong },
  dotOnline: { backgroundColor: colors.emerald600 },
})

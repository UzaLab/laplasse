import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import type { CourierJobRow, DeliveryJobStatus } from '@laplasse/api-client'
import { Ionicons } from '@expo/vector-icons'
import { Card, PrimaryButton, SecondaryButton } from '@/src/components/ui'
import { getApiClient } from '@/src/lib/api'
import { courierCashTenderMessage } from '@/src/lib/foodCashTender'
import { formatFcfa, vehicleLabel } from '@/src/lib/labels'
import { JOB_STATUS_LABELS, JOB_STATUS_STYLES, NEXT_JOB_ACTION } from '@/src/lib/jobLabels'
import { colors, fonts } from '@/src/theme'

interface Props {
  job: CourierJobRow
  mode: 'available' | 'active' | 'history'
  onAccept?: (jobId: string) => Promise<void>
  onReject?: (jobId: string) => Promise<void>
  onAdvance?: (jobId: string, status: DeliveryJobStatus, proofOtp?: string) => Promise<void>
  onProofUploaded?: () => void
  loading?: boolean
}

export function CourierJobCard({ job, mode, onAccept, onReject, onAdvance, onProofUploaded, loading }: Props) {
  const router = useRouter()
  const [localLoading, setLocalLoading] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(job.offer_seconds_left)
  const [proofOtp, setProofOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const busy = loading || localLoading
  const next = mode === 'active' ? NEXT_JOB_ACTION[job.status] : null
  const needsProofOtp = next?.status === 'DELIVERED'
  const urgentOffer = mode === 'available' && job.offered_to_me && (secondsLeft ?? 0) > 0
  const statusStyle = JOB_STATUS_STYLES[job.status]
  const cashTenderNote = courierCashTenderMessage(
    job.order.total,
    job.order.food_cash_exact,
    job.order.food_cash_tender_amount,
  )
  const dropoffLine = [job.dropoff_address || job.order.delivery_address, job.order.delivery_district]
    .filter(Boolean)
    .join(', ') || '—'

  useEffect(() => {
    setSecondsLeft(job.offer_seconds_left)
  }, [job.offer_seconds_left, job.id])

  useEffect(() => {
    if (!urgentOffer || secondsLeft == null || secondsLeft <= 0) return
    const t = setInterval(() => {
      setSecondsLeft(prev => (prev != null && prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(t)
  }, [urgentOffer, secondsLeft])

  const handleAdvance = async () => {
    if (!onAdvance || !next) return
    if (needsProofOtp && proofOtp.trim().length < 4) {
      setOtpError('Saisissez le code remis au client')
      return
    }
    setOtpError('')
    setLocalLoading(true)
    try {
      await onAdvance(job.id, next.status, needsProofOtp ? proofOtp.trim() : undefined)
    } finally {
      setLocalLoading(false)
    }
  }

  const handleProofPhoto = async () => {
    setPhotoError('')
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      setPhotoError('Autorisez la caméra pour la preuve de livraison')
      return
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.75 })
    if (result.canceled || !result.assets[0]) return

    setUploadingPhoto(true)
    try {
      const asset = result.assets[0]
      const formData = new FormData()
      formData.append('file', {
        uri: asset.uri,
        name: 'proof.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      } as unknown as Blob)
      await getApiClient().uploadCourierProofPhoto(job.id, formData)
      onProofUploaded?.()
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Upload impossible')
    } finally {
      setUploadingPhoto(false)
    }
  }

  return (
    <Card style={urgentOffer ? styles.cardUrgent : undefined}>
      {urgentOffer ? (
        <View style={styles.urgentBanner}>
          <Text style={styles.urgentLabel}>Offre exclusive pour vous</Text>
          <View style={styles.urgentTimerRow}>
            <Ionicons name="time-outline" size={14} color="#b45309" />
            <Text style={styles.urgentTimer}>{secondsLeft}s</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.rowBetween}>
        <View style={styles.headerCopy}>
          <View style={styles.shopRow}>
            <Ionicons name="storefront-outline" size={16} color={colors.emerald600} />
            <Text style={styles.shopName}>{job.order.shop_name}</Text>
          </View>
          <Text style={styles.orderMeta}>
            {job.order.item_count} article{job.order.item_count > 1 ? 's' : ''} · {formatFcfa(job.order.total)}
          </Text>
          {job.required_vehicle ? (
            <View style={styles.vehicleBadge}>
              <Ionicons name="car-outline" size={10} color="#c2410c" />
              <Text style={styles.vehicleBadgeText}>{vehicleLabel(job.required_vehicle)} requis</Text>
            </View>
          ) : null}
        </View>
        <View style={[styles.badge, statusStyle.container, statusStyle.container.borderColor ? styles.badgeBorder : null]}>
          <Text style={[styles.badgeText, statusStyle.text]}>{JOB_STATUS_LABELS[job.status]}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.metaRow}>
          <Ionicons name="cube-outline" size={15} color={colors.textMuted} />
          <View style={styles.metaCopy}>
            <Text style={styles.metaLabel}>Retrait</Text>
            <Text style={styles.meta}>{job.pickup_address ?? job.order.shop_address ?? '—'}</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={15} color={colors.emerald600} />
          <View style={styles.metaCopy}>
            <Text style={styles.metaLabel}>Livraison</Text>
            <Text style={styles.meta}>{dropoffLine}</Text>
          </View>
        </View>
        {(job.order.customer_name || job.order.customer_phone) ? (
          <View style={styles.metaRow}>
            <Ionicons name="person-outline" size={15} color={colors.textMuted} />
            <View style={styles.metaCopy}>
              {job.order.customer_name ? (
                <Text style={styles.customerName}>{job.order.customer_name}</Text>
              ) : null}
              {job.order.customer_phone ? (
                <Pressable
                  style={styles.phoneRow}
                  onPress={() => void Linking.openURL(`tel:${job.order.customer_phone}`)}
                >
                  <Ionicons name="call-outline" size={13} color={colors.emerald700} />
                  <Text style={styles.phone}>{job.order.customer_phone}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : null}
        {job.order.customer_note ? (
          <View style={styles.metaRow}>
            <Ionicons name="chatbubble-ellipses-outline" size={15} color="#f59e0b" />
            <Text style={styles.note}>{job.order.customer_note}</Text>
          </View>
        ) : null}
        {cashTenderNote ? (
          <View style={styles.cashNote}>
            <Text style={styles.cashNoteText}>{cashTenderNote}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footerMeta}>
        {job.eta_minutes != null ? (
          <View style={styles.footerItem}>
            <Ionicons name="time-outline" size={12} color={colors.textMuted} />
            <Text style={styles.footerText}>ETA ~{job.eta_minutes} min</Text>
          </View>
        ) : null}
        {job.order.delivery_fee > 0 ? (
          <Text style={styles.feeValue}>+{formatFcfa(job.order.delivery_fee)}</Text>
        ) : null}
      </View>

      {mode === 'available' && job.offered_to_me ? (
        <View style={styles.actions}>
          <PrimaryButton
            label="Accepter la mission"
            loading={busy}
            onPress={async () => {
              if (!onAccept) return
              setLocalLoading(true)
              try {
                await onAccept(job.id)
              } finally {
                setLocalLoading(false)
              }
            }}
          />
          <SecondaryButton
            label="Refuser"
            onPress={async () => {
              if (!onReject) return
              setLocalLoading(true)
              try {
                await onReject(job.id)
              } finally {
                setLocalLoading(false)
              }
            }}
          />
        </View>
      ) : null}

      {mode === 'active' && next ? (
        <View style={styles.actions}>
          <Pressable onPress={() => router.push(`/(courier)/mission/${job.id}`)}>
            <Text style={styles.mapLink}>Voir la carte</Text>
          </Pressable>
          {needsProofOtp ? (
            <>
              <TextInput
                value={proofOtp}
                onChangeText={setProofOtp}
                placeholder="Code OTP client"
                keyboardType="number-pad"
                style={styles.otpInput}
                placeholderTextColor={colors.textMuted}
              />
              {otpError ? <Text style={styles.error}>{otpError}</Text> : null}
              <SecondaryButton
                label={uploadingPhoto ? 'Envoi photo…' : 'Photo preuve (optionnel)'}
                onPress={() => void handleProofPhoto()}
              />
              {photoError ? <Text style={styles.error}>{photoError}</Text> : null}
            </>
          ) : null}
          <PrimaryButton label={next.label} loading={busy} onPress={() => void handleAdvance()} />
        </View>
      ) : null}
    </Card>
  )
}

const styles = StyleSheet.create({
  cardUrgent: { borderColor: '#fcd34d', borderWidth: 2 },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  urgentLabel: { fontFamily: fonts.bold, fontSize: 12, color: '#92400e' },
  urgentTimerRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  urgentTimer: { fontFamily: fonts.extrabold, fontSize: 14, color: '#b45309' },
  rowBetween: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  headerCopy: { flex: 1, gap: 4 },
  shopRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  shopName: { flex: 1, fontFamily: fonts.extrabold, fontSize: 17, color: colors.text },
  orderMeta: { fontFamily: fonts.regular, fontSize: 12, color: colors.textLight },
  vehicleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#ffedd5',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
  },
  vehicleBadgeText: { fontFamily: fonts.bold, fontSize: 10, color: '#c2410c' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeBorder: { borderWidth: 1 },
  badgeText: { fontFamily: fonts.bold, fontSize: 10, textTransform: 'uppercase' },
  section: { gap: 10, marginTop: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  metaCopy: { flex: 1, gap: 2 },
  metaLabel: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.textLight,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  meta: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  customerName: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  note: { flex: 1, fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, fontStyle: 'italic', lineHeight: 18 },
  cashNote: {
    backgroundColor: colors.emerald50,
    borderWidth: 1,
    borderColor: colors.emerald100,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cashNoteText: { fontFamily: fonts.bold, fontSize: 12, color: colors.emerald800 },
  footerMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 12 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted },
  feeValue: { fontFamily: fonts.bold, fontSize: 12, color: colors.emerald700 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  phone: { fontFamily: fonts.semibold, fontSize: 14, color: colors.emerald700 },
  actions: { marginTop: 16, gap: 10 },
  otpInput: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.medium,
    fontSize: 18,
    letterSpacing: 4,
    textAlign: 'center',
    backgroundColor: colors.surface,
  },
  error: { fontFamily: fonts.medium, fontSize: 13, color: colors.danger, textAlign: 'center' },
  mapLink: { fontFamily: fonts.semibold, fontSize: 14, color: colors.emerald700, textAlign: 'center', marginBottom: 4 },
})

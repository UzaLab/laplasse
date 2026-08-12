import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState, type RefObject } from 'react'
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { formatPrice } from '@laplasse/shared-config'
import type { BookingSettingsConfig, MerchantServiceConfig } from '@laplasse/api-client'
import { getApiClient } from '@/src/lib/api'
import {
  bookingPaymentFootnote,
  computeBookingPaymentPreview,
} from '@/src/lib/bookingPaymentDisplay'
import { notify } from '@/src/lib/notify'
import { useAuthStore } from '@/src/stores/authStore'
import { InlineDateCalendar } from './InlineDateCalendar'
import { colors, fonts, homeLayout } from '@/src/theme'

function serviceIcon(categorySlug: string, name: string): keyof typeof Ionicons.glyphMap {
  if (categorySlug === 'pharmacies') return 'medkit-outline'
  const lower = name.toLowerCase()
  if (lower.includes('massage') || lower.includes('spa')) return 'leaf-outline'
  if (lower.includes('visage') || lower.includes('soin')) return 'happy-outline'
  if (categorySlug === 'fitness') return 'barbell-outline'
  return 'sparkles-outline'
}

function ConditionsCard({ settings }: { settings?: BookingSettingsConfig | null }) {
  if (!settings?.cancellation_policy && !settings?.no_show_policy && !settings?.require_payment) {
    return null
  }

  return (
    <View style={styles.conditionsCard}>
      <Text style={styles.conditionsTitle}>Conditions de réservation</Text>
      {settings.require_payment ? (
        <Text style={styles.conditionsText}>
          <Text style={styles.conditionsStrong}>
            {settings.deposit_percent != null && settings.deposit_percent < 100
              ? `Acompte de ${settings.deposit_percent} %`
              : 'Paiement'}
          </Text>
          {' '}à la confirmation.
        </Text>
      ) : null}
      {settings.cancellation_policy ? (
        <Text style={styles.conditionsText}>
          <Text style={styles.conditionsStrong}>Annulation : </Text>
          {settings.cancellation_policy}
        </Text>
      ) : null}
      {settings.no_show_policy ? (
        <Text style={styles.conditionsText}>
          <Text style={styles.conditionsStrong}>Absence (no-show) : </Text>
          {settings.no_show_policy}
        </Text>
      ) : null}
    </View>
  )
}

function ServiceCard({
  service,
  categorySlug,
  settings,
  onDetails,
  onBook,
}: {
  service: MerchantServiceConfig
  categorySlug: string
  settings?: BookingSettingsConfig | null
  onDetails: () => void
  onBook: () => void
}) {
  const preview = computeBookingPaymentPreview(service.price, settings)
  const footnote = bookingPaymentFootnote(preview)

  return (
    <View style={styles.serviceCard}>
      <View style={styles.serviceTop}>
        <View style={styles.serviceLeft}>
          <View style={styles.serviceIconWrap}>
            <Ionicons
              name={serviceIcon(categorySlug, service.name)}
              size={18}
              color={colors.textMuted}
            />
          </View>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{service.name}</Text>
            {service.duration_min > 0 ? (
              <View style={styles.durationRow}>
                <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                <Text style={styles.durationText}>{service.duration_min} min</Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={styles.servicePriceCol}>
          {service.price != null && service.price > 0 ? (
            <Text style={styles.servicePrice}>{formatPrice(service.price, 'XOF')}</Text>
          ) : (
            <Text style={styles.servicePriceMuted}>Sur devis</Text>
          )}
          {preview?.requirePayment && preview.dueNow > 0 ? (
            <Text style={styles.depositHint}>
              Acompte {formatPrice(preview.dueNow, 'XOF')}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.serviceActions}>
        <Pressable onPress={onDetails} style={styles.detailsBtn}>
          <Text style={styles.detailsBtnText}>Détails</Text>
        </Pressable>
        <Pressable onPress={onBook} style={styles.bookServiceBtn}>
          <Text style={styles.bookServiceBtnText}>Réserver</Text>
        </Pressable>
      </View>

      {footnote ? <Text style={styles.serviceFootnote}>{footnote}</Text> : null}
    </View>
  )
}

export function ServicePrestationsTab({
  merchantId,
  merchantName,
  categorySlug,
  bookingAnchorRef,
  onBookingLayout,
  preselectedServiceId,
  onPreselectedConsumed,
  onScrollToBooking,
}: {
  merchantId: string
  merchantSlug: string
  merchantName: string
  categorySlug: string
  bookingAnchorRef?: RefObject<View | null>
  onBookingLayout?: (y: number) => void
  preselectedServiceId?: string | null
  onPreselectedConsumed?: () => void
  onScrollToBooking?: (serviceId: string) => void
}) {
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const isPharmacy = categorySlug === 'pharmacies'
  const targetKind = isPharmacy ? 'CONSULTATION' : 'APPOINTMENT'
  const itemLabel = isPharmacy ? 'consultation' : 'prestation'
  const itemLabelPlural = isPharmacy ? 'consultations' : 'prestations'

  const [detailService, setDetailService] = useState<MerchantServiceConfig | null>(null)
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const [date, setDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [guestName, setGuestName] = useState(user?.full_name ?? '')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestEmail, setGuestEmail] = useState(user?.email ?? '')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formError, setFormError] = useState('')

  const configQuery = useQuery({
    queryKey: ['booking-config', merchantId],
    queryFn: () => getApiClient().getMerchantBookingConfig(merchantId),
  })

  const services = useMemo(
    () =>
      (configQuery.data?.services ?? []).filter(
        s => !s.service_kind || s.service_kind === targetKind,
      ),
    [configQuery.data?.services, targetKind],
  )

  const selectedService =
    services.find(s => s.id === selectedServiceId) ?? services[0] ?? null

  useEffect(() => {
    if (preselectedServiceId && services.some(s => s.id === preselectedServiceId)) {
      setSelectedServiceId(preselectedServiceId)
      onPreselectedConsumed?.()
    }
  }, [preselectedServiceId, services, onPreselectedConsumed])

  useEffect(() => {
    if (!selectedServiceId && services[0]) {
      setSelectedServiceId(services[0].id)
    }
  }, [services, selectedServiceId])

  useEffect(() => {
    if (user) {
      setGuestName(v => v || user.full_name || '')
      setGuestEmail(v => v || user.email || '')
      setGuestPhone(v => v || user.phone || '')
    }
  }, [user])

  const slotsQuery = useQuery({
    queryKey: ['booking-slots', merchantId, date, selectedServiceId],
    queryFn: () =>
      getApiClient().getMerchantBookingAvailability(merchantId, date, {
        serviceId: selectedServiceId ?? undefined,
      }),
    enabled: !!date && !!selectedServiceId && !!configQuery.data?.enabled,
  })

  const availableSlots = (slotsQuery.data?.slots ?? []).filter(s => s.available)
  const settings = configQuery.data?.booking_settings
  const paymentPreview = computeBookingPaymentPreview(selectedService?.price, settings)
  const bookingType = isPharmacy ? 'CONSULTATION' : 'APPOINTMENT'
  const ctaLabel = configQuery.data?.cta ?? 'Prendre RDV'

  const bookService = useCallback((serviceId: string) => {
    setSelectedServiceId(serviceId)
    setSelectedSlot('')
    onScrollToBooking?.(serviceId)
  }, [onScrollToBooking])

  const handleSubmit = async () => {
    setFormError('')

    if (!selectedService) {
      const msg = `Choisissez une ${itemLabel}.`
      setFormError(msg)
      notify.warning('Réservation', msg)
      return
    }
    if (!date) {
      const msg = 'Choisissez une date.'
      setFormError(msg)
      notify.warning('Réservation', msg)
      return
    }
    if (!selectedSlot) {
      const msg = 'Choisissez un créneau disponible.'
      setFormError(msg)
      notify.warning('Réservation', msg)
      return
    }
    if (!guestName.trim() || !guestPhone.trim()) {
      const msg = 'Veuillez renseigner votre nom et téléphone.'
      setFormError(msg)
      notify.warning('Informations requises', msg)
      return
    }
    if (paymentPreview?.requirePayment && !isAuthenticated) {
      const msg = 'Connectez-vous pour finaliser le paiement de votre réservation.'
      setFormError(msg)
      notify.warning('Connexion requise', msg)
      router.push('/(auth)/login')
      return
    }

    setSubmitting(true)
    try {
      const result = await getApiClient().createMerchantBooking(merchantId, {
        guest_name: guestName.trim(),
        guest_phone: guestPhone.trim(),
        guest_email: guestEmail.trim() || undefined,
        booked_at: new Date(`${date}T${selectedSlot}:00`).toISOString(),
        party_size: 1,
        service_id: selectedService.id,
        booking_type: bookingType,
        notes: notes.trim() || undefined,
      })

      if (result.payment_required && result.payment?.id) {
        notify.info('Paiement requis', 'Finalisez votre acompte pour confirmer la réservation.')
        router.push({
          pathname: '/bookings/pay',
          params: { bookingId: result.id },
        } as never)
        return
      }

      setSuccess(true)
      notify.success('Demande envoyée', `${merchantName} confirmera votre rendez-vous sous peu.`)
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : 'Impossible d\'envoyer la demande de réservation.'
      setFormError(msg)
      notify.error('Réservation', msg)
    } finally {
      setSubmitting(false)
    }
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
          Contactez directement {merchantName} pour connaître les disponibilités.
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <ConditionsCard settings={settings} />

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>
          {services.length} {services.length > 1 ? itemLabelPlural : itemLabel}
        </Text>
        <Text style={styles.listSubtitle}>
          Tarifs et durées indicatifs — choisissez un créneau pour réserver
        </Text>
      </View>

      {services.map(service => (
        <ServiceCard
          key={service.id}
          service={service}
          categorySlug={categorySlug}
          settings={settings}
          onDetails={() => setDetailService(service)}
          onBook={() => bookService(service.id)}
        />
      ))}

      <View
        ref={bookingAnchorRef}
        onLayout={e => onBookingLayout?.(e.nativeEvent.layout.y)}
        style={styles.bookingCard}
      >
        <Text style={styles.bookingTitle}>
          <Ionicons name="calendar-outline" size={18} color={colors.brand500} />
          {'  '}{ctaLabel}
        </Text>
        <Text style={styles.bookingSubtitle}>
          {isPharmacy ? 'Consultation' : 'Prestation'} — créneaux selon horaires d&apos;ouverture
        </Text>

        {success ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={32} color={colors.success} />
            <Text style={styles.successTitle}>Demande envoyée !</Text>
            <Text style={styles.successBody}>
              {merchantName} confirmera votre réservation sous peu.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.fieldLabel}>Prestation *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.servicePills}>
              {services.map(s => {
                const active = selectedService?.id === s.id
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => {
                      setSelectedServiceId(s.id)
                      setSelectedSlot('')
                    }}
                    style={[styles.servicePill, active && styles.servicePillActive]}
                  >
                    <Text style={[styles.servicePillText, active && styles.servicePillTextActive]}>
                      {s.name}
                    </Text>
                  </Pressable>
                )
              })}
            </ScrollView>

            {paymentPreview?.requirePayment && paymentPreview.dueNow > 0 ? (
              <View style={styles.paymentBanner}>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Tarif prestation</Text>
                  <Text style={styles.paymentValue}>
                    {formatPrice(paymentPreview.baseAmount, 'XOF')}
                  </Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>
                    À payer maintenant ({paymentPreview.depositPercent} %)
                  </Text>
                  <Text style={styles.paymentValueBold}>
                    {formatPrice(paymentPreview.dueNow, 'XOF')}
                  </Text>
                </View>
              </View>
            ) : selectedService?.price ? (
              <Text style={styles.rateHint}>
                Tarif indicatif : {formatPrice(selectedService.price, 'XOF')}
              </Text>
            ) : null}

            <Text style={styles.fieldLabel}>Date *</Text>
            <InlineDateCalendar
              value={date}
              onChange={nextDate => {
                setDate(nextDate)
                setSelectedSlot('')
              }}
            />

            {date ? (
              <View style={styles.slotsBlock}>
                <Text style={styles.fieldLabel}>Créneaux disponibles</Text>
                {slotsQuery.isLoading ? (
                  <ActivityIndicator color={colors.brand500} style={{ marginVertical: 8 }} />
                ) : slotsQuery.data?.closed ? (
                  <Text style={styles.slotsEmpty}>
                    {slotsQuery.data.reason ?? 'Aucun créneau ce jour'}
                  </Text>
                ) : availableSlots.length === 0 ? (
                  <Text style={styles.slotsEmpty}>Aucun créneau ce jour</Text>
                ) : (
                  <View style={styles.slotsGrid}>
                    {availableSlots.map(slot => {
                      const active = selectedSlot === slot.time
                      return (
                        <Pressable
                          key={slot.time}
                          onPress={() => setSelectedSlot(slot.time)}
                          style={[styles.slotPill, active && styles.slotPillActive]}
                        >
                          <Text style={[styles.slotText, active && styles.slotTextActive]}>
                            {slot.time}
                          </Text>
                        </Pressable>
                      )
                    })}
                  </View>
                )}
              </View>
            ) : null}

            <TextInput
              value={guestName}
              onChangeText={setGuestName}
              placeholder="Votre nom *"
              placeholderTextColor={colors.textLight}
              style={styles.input}
            />
            <TextInput
              value={guestPhone}
              onChangeText={setGuestPhone}
              placeholder="Téléphone *"
              placeholderTextColor={colors.textLight}
              keyboardType="phone-pad"
              style={styles.input}
            />
            <TextInput
              value={guestEmail}
              onChangeText={setGuestEmail}
              placeholder="E-mail (optionnel)"
              placeholderTextColor={colors.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes (optionnel)"
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={2}
              style={[styles.input, styles.textarea]}
            />

            {formError ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={styles.errorText}>{formError}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={() => void handleSubmit()}
              disabled={submitting}
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>{ctaLabel}</Text>
              )}
            </Pressable>

            <Text style={styles.formFootnote}>{bookingPaymentFootnote(paymentPreview)}</Text>
          </>
        )}
      </View>

      <Modal
        visible={!!detailService}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailService(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setDetailService(null)}>
          <Pressable style={styles.modalSheet} onPress={e => e.stopPropagation()}>
            {detailService ? (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{detailService.name}</Text>
                  <Pressable onPress={() => setDetailService(null)}>
                    <Ionicons name="close" size={24} color={colors.textMuted} />
                  </Pressable>
                </View>
                {detailService.duration_min > 0 ? (
                  <View style={styles.modalMeta}>
                    <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.modalMetaText}>{detailService.duration_min} min</Text>
                  </View>
                ) : null}
                {detailService.price != null && detailService.price > 0 ? (
                  <Text style={styles.modalPrice}>
                    {formatPrice(detailService.price, 'XOF')}
                  </Text>
                ) : null}
                {detailService.description ? (
                  <Text style={styles.modalDesc}>{detailService.description}</Text>
                ) : (
                  <Text style={styles.modalDescMuted}>Aucune description disponible.</Text>
                )}
                <Pressable
                  onPress={() => {
                    bookService(detailService.id)
                    setDetailService(null)
                  }}
                  style={styles.modalBookBtn}
                >
                  <Text style={styles.modalBookBtnText}>Réserver</Text>
                </Pressable>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { gap: 16 },
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
  emptyBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  conditionsCard: {
    backgroundColor: colors.surface,
    borderRadius: homeLayout.radiusLg,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  conditionsTitle: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  conditionsText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
  },
  conditionsStrong: { fontFamily: fonts.semibold, color: colors.text },
  listHeader: { gap: 4 },
  listTitle: { fontFamily: fonts.bold, fontSize: 20, color: colors.text },
  listSubtitle: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  serviceCard: {
    backgroundColor: colors.surface,
    borderRadius: homeLayout.radiusLg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  serviceTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  serviceLeft: { flex: 1, flexDirection: 'row', gap: 12 },
  serviceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceInfo: { flex: 1, gap: 4 },
  serviceName: { fontFamily: fonts.bold, fontSize: 17, color: colors.text, lineHeight: 22 },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  durationText: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  servicePriceCol: { alignItems: 'flex-end' },
  servicePrice: { fontFamily: fonts.bold, fontSize: 17, color: colors.text },
  servicePriceMuted: { fontFamily: fonts.semibold, fontSize: 13, color: colors.textMuted },
  depositHint: {
    fontFamily: fonts.semibold,
    fontSize: 11,
    color: colors.success,
    marginTop: 2,
    textAlign: 'right',
  },
  serviceActions: { flexDirection: 'row', gap: 8 },
  detailsBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: homeLayout.radiusLg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
  },
  detailsBtnText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  bookServiceBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: homeLayout.radiusLg,
    backgroundColor: colors.slate900,
    alignItems: 'center',
  },
  bookServiceBtnText: { fontFamily: fonts.semibold, fontSize: 14, color: '#fff' },
  serviceFootnote: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
  bookingCard: {
    backgroundColor: colors.surface,
    borderRadius: homeLayout.radiusXl,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    marginTop: 8,
  },
  bookingTitle: { fontFamily: fonts.bold, fontSize: 18, color: colors.text },
  bookingSubtitle: { fontFamily: fonts.regular, fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  fieldLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.textMuted,
    letterSpacing: 0.4,
  },
  servicePills: { gap: 8, paddingBottom: 4 },
  servicePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.background,
  },
  servicePillActive: { backgroundColor: colors.slate900, borderColor: colors.slate900 },
  servicePillText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.text },
  servicePillTextActive: { color: '#fff' },
  paymentBanner: {
    backgroundColor: colors.brand50,
    borderRadius: homeLayout.radiusLg,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.brand100,
    gap: 6,
  },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  paymentLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.brand800 },
  paymentValue: { fontFamily: fonts.bold, fontSize: 13, color: colors.brand800 },
  paymentValueBold: { fontFamily: fonts.extrabold, fontSize: 14, color: colors.brand800 },
  rateHint: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.brand700,
    backgroundColor: colors.brand50,
    padding: 10,
    borderRadius: homeLayout.radiusLg,
  },
  input: {
    borderWidth: 2,
    borderColor: colors.borderStrong,
    borderRadius: homeLayout.radiusLg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
  },
  textarea: { minHeight: 72, textAlignVertical: 'top' },
  slotsBlock: { gap: 8 },
  slotsEmpty: { fontFamily: fonts.regular, fontSize: 13, color: colors.textMuted },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: homeLayout.radiusLg,
    borderWidth: 2,
    borderColor: colors.borderStrong,
  },
  slotPillActive: { backgroundColor: colors.slate900, borderColor: colors.slate900 },
  slotText: { fontFamily: fonts.bold, fontSize: 13, color: colors.text },
  slotTextActive: { color: '#fff' },
  submitBtn: {
    backgroundColor: colors.slate900,
    borderRadius: homeLayout.radiusLg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { fontFamily: fonts.bold, fontSize: 15, color: '#fff' },
  formFootnote: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderRadius: homeLayout.radiusLg,
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
  },
  errorText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#991b1b',
    lineHeight: 18,
  },
  successBox: {
    alignItems: 'center',
    gap: 8,
    padding: 24,
    backgroundColor: '#ecfdf5',
    borderRadius: homeLayout.radiusLg,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  successTitle: { fontFamily: fonts.bold, fontSize: 16, color: '#065f46' },
  successBody: { fontFamily: fonts.regular, fontSize: 14, color: '#047857', textAlign: 'center' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 12,
    maxHeight: '80%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  modalTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 20, color: colors.text, paddingRight: 12 },
  modalMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modalMetaText: { fontFamily: fonts.regular, fontSize: 14, color: colors.textMuted },
  modalPrice: { fontFamily: fonts.extrabold, fontSize: 22, color: colors.brand600 },
  modalDesc: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted, lineHeight: 24 },
  modalDescMuted: { fontFamily: fonts.regular, fontSize: 14, color: colors.textLight },
  modalBookBtn: {
    backgroundColor: colors.slate900,
    borderRadius: homeLayout.radiusLg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  modalBookBtnText: { fontFamily: fonts.bold, fontSize: 15, color: '#fff' },
})

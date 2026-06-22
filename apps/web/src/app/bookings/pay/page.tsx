'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditCard, Loader2, Smartphone, XCircle } from 'lucide-react'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { useRequireAuth } from '@/hooks/useRequireAuth'
import { PAGE_CONTAINER } from '@/lib/pageLayout'
import { confirmBookingPayment, fetchBookingPayment, type BookingPaymentSession } from '@/lib/bookingPaymentApi'
import { formatPrice } from '@/lib/marketplaceApi'
import { notify } from '@/lib/notify'
import { useT } from '@/providers/LocaleProvider'

export default function BookingPaymentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={28} /></div>}>
      <BookingPaymentContent />
    </Suspense>
  )
}

function BookingPaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bookingId = searchParams.get('bookingId') ?? ''
  const t = useT()
  const { hydrated, isAuthenticated } = useRequireAuth('/bookings/pay')
  const [session, setSession] = useState<BookingPaymentSession | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!hydrated || !isAuthenticated || !bookingId) return
    fetchBookingPayment(bookingId).then(data => {
      if (!data?.payment_required || !data.payment) {
        router.replace('/profile/bookings')
        return
      }
      setSession(data)
    })
  }, [hydrated, isAuthenticated, bookingId, router])

  const handleConfirm = async (simulateResult: 'success' | 'failure') => {
    if (!session?.payment) return
    setProcessing(true)
    const { result, error } = await confirmBookingPayment(
      session.booking_id,
      session.payment.id,
      simulateResult,
    )
    setProcessing(false)
    if (!result) {
      notify.error(error ?? 'Erreur de paiement')
      return
    }
    if (simulateResult === 'success') {
      notify.success(t('booking.paymentSuccess'))
      router.push('/profile/bookings')
    } else {
      notify.warning('Paiement échoué')
    }
  }

  if (!hydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!session?.payment) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-slate-300" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <main className={`${PAGE_CONTAINER} py-10`}>
        <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-[32px] p-8 shadow-xl shadow-slate-200/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <CreditCard size={22} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">{t('booking.payNow')}</h1>
              <p className="text-sm text-slate-500">{session.merchant_name}</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 mb-6">
            <p className="text-sm text-slate-500">{t('booking.deposit')}</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">
              {formatPrice(session.payment.amount)}
            </p>
            <p className="text-xs text-slate-400 mt-2">Réf. {session.payment.reference}</p>
          </div>

          <p className="text-sm text-slate-500 mb-6">{session.payment.instructions}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              disabled={processing}
              onClick={() => void handleConfirm('success')}
              className="h-14 rounded-2xl bg-emerald-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {processing ? <Loader2 className="animate-spin" size={18} /> : <Smartphone size={18} />}
              Simuler succès
            </button>
            <button
              type="button"
              disabled={processing}
              onClick={() => void handleConfirm('failure')}
              className="h-14 rounded-2xl bg-white border-2 border-slate-200 text-slate-700 font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <XCircle size={18} /> Simuler échec
            </button>
          </div>

          <Link href="/profile/bookings" className="block text-center text-sm font-bold text-slate-500 mt-6 hover:text-slate-900">
            Payer plus tard
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Loader2, ArrowLeft, ShoppingCart, User, CreditCard, Truck, Package,
  Clock, CheckCircle2, XCircle, AlertCircle, ExternalLink,
  MapPin, Phone,
} from 'lucide-react'
import { adminFetch } from '@/lib/adminApi'
import { useAdminSession } from '@/features/admin/hooks/useAdminSession'
import { AdminPageContainer } from '@/features/admin/components/AdminPageContainer'
import { notify } from '@/lib/notify'

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = 'PENDING'|'CONFIRMED'|'PREPARING'|'READY'|'OUT_FOR_DELIVERY'|'DELIVERED'|'COMPLETED'|'CANCELLED'|'REFUNDED'

interface OrderItem {
  id: string
  quantity: number
  unit_price: number
  line_total: number
  product_name: string
  variant_name: string | null
  product?: { id: string; name: string; slug: string } | null
  menu_item?: { id: string; name: string } | null
}

interface OrderDetail {
  id: string
  status: OrderStatus
  total: number
  currency: string
  delivery_type: string
  order_source: string
  delivery_address: string | null
  customer_note: string | null
  subtotal: number
  delivery_fee: number
  discount_amount: number
  created_at: string
  updated_at: string
  user: { id: string; email: string; full_name: string | null; phone: string | null }
  shop: { id: string; name: string; slug: string } | null
  merchant: { id: string; business_name: string; slug: string } | null
  items: OrderItem[]
  payment: {
    id: string
    status: string
    reference: string
    amount: number
    currency: string
    provider: string
    paid_at: string | null
  } | null
  return_request: {
    id: string
    reason: string
    status: string
    created_at: string
  } | null
  delivery_job: {
    id: string
    status: string
    fulfilment_mode: string
    created_at: string
    courier_profile: {
      id: string
      phone: string
      vehicle: string | null
      rating_avg: number
      user: { full_name: string | null; email: string }
    } | null
  } | null
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'En attente', CONFIRMED: 'Confirmée', PREPARING: 'Préparation',
  READY: 'Prête', OUT_FOR_DELIVERY: 'En livraison', DELIVERED: 'Livrée',
  COMPLETED: 'Terminée', CANCELLED: 'Annulée', REFUNDED: 'Remboursée',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  CONFIRMED: 'bg-sky-100 text-sky-800 border-sky-200',
  PREPARING: 'bg-violet-100 text-violet-800 border-violet-200',
  READY: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  OUT_FOR_DELIVERY: 'bg-blue-100 text-blue-800 border-blue-200',
  DELIVERED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  COMPLETED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
  REFUNDED: 'bg-red-100 text-red-700 border-red-200',
}

const STATUS_FLOW: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED']
const TERMINAL_STATUSES: OrderStatus[] = ['DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED']
const ADMIN_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['OUT_FOR_DELIVERY', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['COMPLETED', 'REFUNDED'],
  COMPLETED: ['REFUNDED'],
  CANCELLED: [],
  REFUNDED: [],
}

const PAYMENT_COLORS: Record<string, string> = {
  PAID: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  FAILED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-slate-100 text-slate-600',
}

function formatMoney(value: number | null | undefined, currency: string) {
  return `${(value ?? 0).toLocaleString('fr-FR')} ${currency}`
}

function itemLabel(item: OrderItem) {
  const base = item.product_name || item.product?.name || item.menu_item?.name || `Article ${item.id.slice(0, 6)}`
  return item.variant_name ? `${base} (${item.variant_name})` : base
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
        <span className="text-slate-500">{icon}</span>
        <h3 className="font-bold text-sm text-slate-700">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span className="text-xs font-semibold text-slate-800 text-right">{value}</span>
    </div>
  )
}

// ─── Status timeline ──────────────────────────────────────────────────────────

function StatusTimeline({ status }: { status: OrderStatus }) {
  const pos = STATUS_FLOW.indexOf(status)
  const isCancelled = status === 'CANCELLED' || status === 'REFUNDED'
  return (
    <div className="flex items-center gap-0.5 overflow-x-auto pb-1">
      {STATUS_FLOW.map((s, i) => {
        const done = !isCancelled && i <= pos
        const current = s === status
        return (
          <div key={s} className="flex items-center gap-0.5 shrink-0">
            <div className={`flex flex-col items-center gap-0.5 ${current ? 'scale-110' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                done ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-[9px] whitespace-nowrap ${done ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                {STATUS_LABELS[s].split(' ')[0]}
              </span>
            </div>
            {i < STATUS_FLOW.length - 1 && (
              <div className={`w-5 h-0.5 -mt-3 rounded ${done && i < pos ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </div>
        )
      })}
      {isCancelled && (
        <div className="ml-2 flex items-center gap-1">
          <XCircle size={18} className="text-red-400" />
          <span className="text-xs font-bold text-red-500">{STATUS_LABELS[status]}</span>
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminOrderDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { ready } = useAdminSession()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [transitioning, setTransitioning] = useState(false)

  useEffect(() => {
    if (!ready) return
    adminFetch<OrderDetail>(`/admin/orders/${params.id}`)
      .then(d => setOrder(d))
      .finally(() => setLoading(false))
  }, [ready, params.id])

  const handleTransition = async (newStatus: OrderStatus) => {
    if (!order) return
    setTransitioning(true)
    const res = await adminFetch<{ status: string }>(`/admin/orders/${order.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    setTransitioning(false)
    if (res) {
      setOrder(o => o ? { ...o, status: newStatus } : o)
      notify.success(`Statut mis à jour : ${STATUS_LABELS[newStatus]}`)
    } else {
      notify.error('Impossible de modifier le statut')
    }
  }

  if (loading) {
    return (
      <AdminPageContainer>
        <div className="flex justify-center py-20">
          <Loader2 size={24} className="animate-spin text-slate-300" />
        </div>
      </AdminPageContainer>
    )
  }

  if (!order) {
    return (
      <AdminPageContainer>
        <div className="flex flex-col items-center py-20 gap-3">
          <AlertCircle size={36} className="text-slate-300" />
          <p className="text-slate-500">Commande introuvable</p>
          <button onClick={() => router.back()} className="text-sm text-violet-600 hover:underline">Retour</button>
        </div>
      </AdminPageContainer>
    )
  }

  const transitions = ADMIN_TRANSITIONS[order.status] ?? []

  return (
    <AdminPageContainer>
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => router.back()}
          className="mt-1 p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 shrink-0">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <ShoppingCart size={18} className="text-violet-600" />
            <h1 className="text-lg font-extrabold text-slate-900 font-mono">#{order.id}</h1>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${STATUS_COLORS[order.status]}`}>
              {STATUS_LABELS[order.status]}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {new Date(order.created_at).toLocaleString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4">
        <p className="text-xs font-semibold text-slate-500 mb-3">Progression</p>
        <StatusTimeline status={order.status} />
      </div>

      {/* Admin actions */}
      {transitions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
            <AlertCircle size={13} /> Actions admin
          </p>
          <div className="flex flex-wrap gap-2">
            {transitions.map(t => (
              <button
                key={t}
                type="button"
                disabled={transitioning}
                onClick={() => handleTransition(t)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors ${
                  t === 'CANCELLED' || t === 'REFUNDED'
                    ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                    : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-700'
                } disabled:opacity-50`}
              >
                {transitioning ? <Loader2 size={12} className="animate-spin" /> : `→ ${STATUS_LABELS[t]}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Items */}
        <SectionCard title="Articles" icon={<Package size={14} />}>
          {order.items.length === 0 ? (
            <p className="text-sm text-slate-400">Aucun article</p>
          ) : (
            <div className="space-y-2">
              {order.items.map(item => (
                <div key={item.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {itemLabel(item)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatMoney(item.unit_price, order.currency)} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-slate-900 shrink-0">
                    {formatMoney(item.line_total, order.currency)}
                  </span>
                </div>
              ))}

              {/* Totals */}
              <div className="pt-2 space-y-1 border-t border-slate-100">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Sous-total</span>
                  <span>{formatMoney(order.subtotal, order.currency)}</span>
                </div>
                {order.delivery_fee > 0 && (
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Livraison</span>
                    <span>{formatMoney(order.delivery_fee, order.currency)}</span>
                  </div>
                )}
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600">
                    <span>Réduction</span>
                    <span>-{formatMoney(order.discount_amount, order.currency)}</span>
                  </div>
                )}
                <div className="flex justify-between font-extrabold text-slate-900">
                  <span>Total</span>
                  <span>{formatMoney(order.total, order.currency)}</span>
                </div>
              </div>
            </div>
          )}
        </SectionCard>

        {/* Customer */}
        <SectionCard title="Client" icon={<User size={14} />}>
          <DataRow label="Nom" value={order.user.full_name ?? '—'} />
          <DataRow label="Email" value={order.user.email} />
          <DataRow label="Téléphone" value={order.user.phone ?? '—'} />
          <DataRow label="ID" value={<span className="font-mono text-[10px]">{order.user.id}</span>} />
          <div className="mt-3 flex gap-2">
            <button onClick={() => router.push(`/admin/users/${order.user.id}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200">
              <ExternalLink size={11} /> Voir le profil
            </button>
          </div>
        </SectionCard>

        {/* Merchant / Shop */}
        <SectionCard title={order.shop ? 'Boutique' : 'Établissement'} icon={<Package size={14} />}>
          {order.shop ? (
            <>
              <DataRow label="Boutique" value={order.shop.name} />
              <DataRow label="Slug" value={order.shop.slug} />
            </>
          ) : order.merchant ? (
            <>
              <DataRow label="Établissement" value={order.merchant.business_name} />
              <DataRow label="Slug" value={order.merchant.slug} />
              <div className="mt-3">
                <button onClick={() => router.push(`/admin/merchants/${order.merchant!.id}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200">
                  <ExternalLink size={11} /> Gérer l'établissement
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">—</p>
          )}
          <DataRow label="Type livraison" value={order.delivery_type === 'DELIVERY' ? 'Livraison' : 'Retrait'} />
          <DataRow label="Source" value={order.order_source} />
          {order.delivery_address && (
            <div className="mt-2 p-2 bg-slate-50 rounded-xl text-xs text-slate-600 flex gap-1.5">
              <MapPin size={12} className="shrink-0 mt-0.5" />
              {order.delivery_address}
            </div>
          )}
          {order.customer_note && (
            <p className="text-xs text-slate-400 mt-1 italic">{order.customer_note}</p>
          )}
        </SectionCard>

        {/* Payment */}
        <SectionCard title="Paiement" icon={<CreditCard size={14} />}>
          {order.payment ? (
            <>
              <DataRow label="Statut" value={
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PAYMENT_COLORS[order.payment.status] ?? 'bg-slate-100 text-slate-500'}`}>
                  {order.payment.status}
                </span>
              } />
              <DataRow label="Référence" value={<span className="font-mono text-[10px]">{order.payment.reference}</span>} />
              <DataRow label="Montant" value={`${order.payment.amount.toLocaleString('fr-FR')} ${order.payment.currency}`} />
              <DataRow label="Fournisseur" value={order.payment.provider} />
              {order.payment.paid_at && (
                <DataRow label="Payé le" value={new Date(order.payment.paid_at).toLocaleString('fr-FR')} />
              )}
            </>
          ) : (
            <p className="text-sm text-slate-400">Aucun paiement enregistré</p>
          )}
        </SectionCard>

        {/* Delivery */}
        {order.delivery_type === 'DELIVERY' && (
          <SectionCard title="Livraison" icon={<Truck size={14} />}>
            {order.delivery_job ? (
              <>
                <DataRow label="Statut job" value={order.delivery_job.status} />
                <DataRow label="Mode" value={order.delivery_job.fulfilment_mode} />
                {order.delivery_job.courier_profile && (
                  <>
                    <div className="mt-2 pt-2 border-t border-slate-100">
                      <p className="text-xs font-semibold text-slate-600 mb-1.5">Livreur</p>
                      <DataRow label="Nom" value={order.delivery_job.courier_profile.user.full_name ?? '—'} />
                      <DataRow label="Téléphone" value={
                        <span className="flex items-center gap-1">
                          <Phone size={10} />
                          {order.delivery_job.courier_profile.phone}
                        </span>
                      } />
                      <DataRow label="Véhicule" value={order.delivery_job.courier_profile.vehicle ?? '—'} />
                      <DataRow label="Note" value={`${order.delivery_job.courier_profile.rating_avg.toFixed(1)} / 5`} />
                    </div>
                  </>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-400">Aucun job de livraison assigné</p>
            )}
          </SectionCard>
        )}

        {/* Return */}
        {order.return_request && (
          <SectionCard title="Retour / Litige" icon={<AlertCircle size={14} />}>
            <DataRow label="Statut" value={order.return_request.status} />
            <DataRow label="Raison" value={order.return_request.reason} />
            <DataRow label="Créé le" value={new Date(order.return_request.created_at).toLocaleString('fr-FR')} />
          </SectionCard>
        )}
      </div>

      {/* Metadata */}
      <div className="bg-slate-50 rounded-xl p-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400">
        <span>Créée : {new Date(order.created_at).toLocaleString('fr-FR')}</span>
        <span>Modifiée : {new Date(order.updated_at).toLocaleString('fr-FR')}</span>
        <span className="font-mono">ID: {order.id}</span>
      </div>
    </AdminPageContainer>
  )
}

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, Camera, Clock, Loader2, MapPin, Package, Phone, Store, X,
} from 'lucide-react'
import type { CourierJobRow, DeliveryJobStatus } from '@/lib/courierJobsApi'
import {
  formatFcfa,
  JOB_STATUS_LABELS,
  JOB_STATUS_STYLES,
  NEXT_JOB_ACTION,
} from '@/lib/courierJobLabels'

interface Props {
  job: CourierJobRow
  mode: 'available' | 'active' | 'history'
  onAccept?: (jobId: string) => Promise<void>
  onReject?: (jobId: string) => Promise<void>
  onAdvance?: (jobId: string, status: DeliveryJobStatus, proofOtp?: string) => Promise<void>
  onProofPhoto?: (jobId: string, file: File) => Promise<void>
  loading?: boolean
}

export function CourierJobCard({ job, mode, onAccept, onReject, onAdvance, onProofPhoto, loading }: Props) {
  const [localLoading, setLocalLoading] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(job.offer_seconds_left)
  const [proofOtp, setProofOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(job.proof_photo_url)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const busy = loading || localLoading
  const next = mode === 'active' ? NEXT_JOB_ACTION[job.status] : null
  const needsProofOtp = next?.status === 'DELIVERED'
  const urgentOffer = mode === 'available' && job.offered_to_me && (secondsLeft ?? 0) > 0

  useEffect(() => {
    setSecondsLeft(job.offer_seconds_left)
  }, [job.offer_seconds_left, job.id])

  useEffect(() => {
    setPhotoUrl(job.proof_photo_url)
  }, [job.proof_photo_url, job.id])

  useEffect(() => {
    if (!urgentOffer || secondsLeft == null || secondsLeft <= 0) return
    const t = window.setInterval(() => {
      setSecondsLeft(prev => (prev != null && prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => window.clearInterval(t)
  }, [urgentOffer, secondsLeft])

  const handleAccept = async () => {
    if (!onAccept) return
    setLocalLoading(true)
    try {
      await onAccept(job.id)
    } catch {
      // Erreur affichée par la page parente
    }
    setLocalLoading(false)
  }

  const handleReject = async () => {
    if (!onReject) return
    setLocalLoading(true)
    try {
      await onReject(job.id)
    } catch {
      // ignore
    }
    setLocalLoading(false)
  }

  const handleAdvance = async () => {
    if (!onAdvance || !next) return
    if (needsProofOtp && proofOtp.trim().length !== 4) return
    setOtpError('')
    setLocalLoading(true)
    try {
      await onAdvance(job.id, next.status, needsProofOtp ? proofOtp.trim() : undefined)
      setProofOtp('')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Action impossible'
      setOtpError(message)
    }
    setLocalLoading(false)
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onProofPhoto) return
    setUploadingPhoto(true)
    await onProofPhoto(job.id, file)
    setUploadingPhoto(false)
    e.target.value = ''
  }

  return (
    <article className={`bg-white rounded-[24px] border p-5 shadow-sm space-y-4 ${
      urgentOffer ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-100'
    }`}>
      {urgentOffer && (
        <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100">
          <p className="text-xs font-bold text-amber-800">Offre exclusive pour vous</p>
          <span className="inline-flex items-center gap-1 text-sm font-black text-amber-700 tabular-nums">
            <Clock size={14} /> {secondsLeft}s
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-slate-900">
            <Store size={16} className="text-emerald-600 shrink-0" />
            <h3 className="font-extrabold">{job.order.shop_name}</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {job.order.item_count} article{job.order.item_count > 1 ? 's' : ''} · {formatFcfa(job.order.total)}
          </p>
        </div>
        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full shrink-0 ${JOB_STATUS_STYLES[job.status]}`}>
          {JOB_STATUS_LABELS[job.status]}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex gap-2">
          <Package size={15} className="text-slate-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Retrait</p>
            <p className="text-slate-700">{job.pickup_address || job.order.shop_address || '—'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <MapPin size={15} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-400">Livraison</p>
            <p className="text-slate-700">
              {[job.dropoff_address || job.order.delivery_address, job.order.delivery_district]
                .filter(Boolean)
                .join(', ') || '—'}
            </p>
          </div>
        </div>
        {job.order.customer_phone && (
          <div className="flex gap-2">
            <Phone size={15} className="text-slate-400 shrink-0 mt-0.5" />
            <a href={`tel:${job.order.customer_phone}`} className="text-emerald-700 font-semibold">
              {job.order.customer_phone}
            </a>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        {job.eta_minutes != null && (
          <span className="inline-flex items-center gap-1">
            <Clock size={12} /> ETA ~{job.eta_minutes} min
          </span>
        )}
        {job.order.delivery_fee > 0 && (
          <span className="font-bold text-emerald-700">+{formatFcfa(job.order.delivery_fee)}</span>
        )}
      </div>

      {mode === 'available' && onAccept && (
        <div className="flex gap-2">
          {onReject && (
            <button
              type="button"
              disabled={busy}
              onClick={handleReject}
              className="px-4 py-3 rounded-full font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 flex items-center justify-center"
              aria-label="Refuser"
            >
              <X size={18} />
            </button>
          )}
          <button
            type="button"
            disabled={busy || (job.offered_to_me && secondsLeft === 0)}
            onClick={handleAccept}
            className="flex-1 py-3 rounded-full font-bold bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
            Accepter la mission
          </button>
        </div>
      )}

      {mode === 'active' && next && onAdvance && (
        <div className="space-y-3">
          {job.status === 'IN_TRANSIT' && onProofPhoto && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                <Camera size={14} /> Photo preuve (optionnel)
              </p>
              {photoUrl ? (
                <div className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl} alt="Preuve livraison" className="w-full max-h-40 object-cover rounded-xl border border-slate-200" />
                  <label className="block text-center text-xs font-bold text-emerald-700 cursor-pointer">
                    {uploadingPhoto ? 'Envoi…' : 'Remplacer la photo'}
                    <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} disabled={uploadingPhoto} />
                  </label>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 py-3 rounded-full border border-dashed border-slate-300 text-sm font-bold text-slate-600 cursor-pointer hover:bg-white">
                  {uploadingPhoto ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                  {uploadingPhoto ? 'Envoi en cours…' : 'Ajouter une photo'}
                  <input type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} disabled={uploadingPhoto} />
                </label>
              )}
            </div>
          )}
          {needsProofOtp && (
            <div className="rounded-full border border-amber-100 bg-amber-50 p-4 space-y-2">
              <p className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                Code client requis
              </p>
              <p className="text-sm text-amber-800/90">
                Demandez le code à 4 chiffres au client avant de confirmer la livraison.
              </p>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={proofOtp}
                onChange={e => {
                  setProofOtp(e.target.value.replace(/\D/g, '').slice(0, 4))
                  if (otpError) setOtpError('')
                }}
                placeholder="0000"
                className={`w-full text-center text-2xl font-black tracking-[0.4em] border rounded-full py-3 bg-white text-slate-900 ${
                  otpError ? 'border-red-300 ring-2 ring-red-100' : 'border-amber-200'
                }`}
                aria-label="Code de livraison client"
                aria-invalid={!!otpError}
              />
              {otpError && (
                <p className="text-sm font-semibold text-red-700 bg-red-50 border border-red-100 rounded-full px-3 py-2">
                  {otpError}
                </p>
              )}
            </div>
          )}
          <button
            type="button"
            disabled={busy || (needsProofOtp && proofOtp.length !== 4)}
            onClick={handleAdvance}
            className="w-full py-3 rounded-full font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
            {next.label}
          </button>
        </div>
      )}

      {mode === 'active' && (
        <Link
          href={`/delivery/track/${job.tracking_token}`}
          className="block text-center text-xs font-bold text-slate-500 hover:text-slate-800"
          style={{ textDecoration: 'none' }}
          target="_blank"
        >
          Voir le suivi client →
        </Link>
      )}
    </article>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Loader2, Trash2, UserPlus, Users } from 'lucide-react'
import {
  fetchMerchantCourierStaff,
  fetchMerchantFleetInviteLink,
  linkMerchantCourierStaff,
  unlinkMerchantCourierStaff,
  type ShopCourierStaff,
} from '@/lib/deliveryStakeholdersApi'
import { LogisticsFleetInviteCard } from '@/features/logistics/components/LogisticsFleetInviteCard'
import { notify } from '@/lib/notify'

interface ShopCourierStaffPanelProps {
  merchantId: string
}

export function ShopCourierStaffPanel({ merchantId }: ShopCourierStaffPanelProps) {
  const [staff, setStaff] = useState<ShopCourierStaff[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [linking, setLinking] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [invite, setInvite] = useState<{ url: string; shop_name: string } | null>(null)

  const load = async () => {
    if (!merchantId) return
    setLoading(true)
    const list = await fetchMerchantCourierStaff(merchantId)
    setStaff(list)
    setLoading(false)
  }

  useEffect(() => {
    void load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantId])

  useEffect(() => {
    if (!merchantId) return
    void fetchMerchantFleetInviteLink(merchantId).then(data => {
      if (data) setInvite({ url: data.url, shop_name: data.shop_name })
    })
  }, [merchantId])

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!merchantId || !email.trim()) return
    setLinking(true)
    const { staff: linked, error } = await linkMerchantCourierStaff(merchantId, email.trim())
    setLinking(false)
    if (error) {
      notify.error(error)
      return
    }
    notify.success(`${linked?.user.full_name ?? 'Livreur'} rattaché à votre établissement`)
    setEmail('')
    void load()
  }

  const handleUnlink = async (profileId: string) => {
    if (!merchantId) return
    setRemoving(profileId)
    const { error } = await unlinkMerchantCourierStaff(merchantId, profileId)
    setRemoving(null)
    if (error) {
      notify.error(error)
      return
    }
    notify.success('Livreur détaché')
    void load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <Users size={22} /> Ma flotte
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Recrutez des livreurs via le lien d&apos;invitation ou rattachez un compte existant après validation KYC.
        </p>
      </div>

      {invite && (
        <LogisticsFleetInviteCard partnerName={invite.shop_name} url={invite.url} />
      )}

      <form onSubmit={handleLink} className="bg-white border border-slate-100 rounded-xl p-6 space-y-3">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <UserPlus size={18} /> Rattacher un livreur existant
        </h3>
        <p className="text-xs text-slate-500">
          Pour un compte déjà inscrit et validé sur LaPlasse.
        </p>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email du compte livreur"
          className="w-full border border-slate-200 rounded-full px-4 py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={linking}
          className="w-full py-3 bg-slate-900 text-white rounded-full font-bold text-sm hover:bg-slate-800 disabled:opacity-50"
        >
          {linking ? 'Rattachement…' : 'Rattacher à ma flotte'}
        </button>
      </form>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-slate-300" size={28} />
        </div>
      ) : staff.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-8">
          Aucun livreur interne. Partagez le lien d&apos;invitation ci-dessus pour recruter.
        </p>
      ) : (
        <ul className="space-y-3">
          {staff.map(c => (
            <li
              key={c.id}
              className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between gap-4"
            >
              <div>
                <p className="font-bold text-slate-900">{c.user.full_name ?? c.user.email}</p>
                <p className="text-sm text-slate-500">
                  {c.phone}
                  {c.vehicle ? ` · ${c.vehicle}` : ''}
                  {' · '}
                  <span className={c.is_online ? 'text-emerald-600' : 'text-slate-400'}>
                    {c.is_online ? 'En ligne' : 'Hors ligne'}
                  </span>
                  {c.status === 'PENDING_REVIEW' && (
                    <span className="text-amber-600"> · En attente validation</span>
                  )}
                </p>
              </div>
              <button
                type="button"
                disabled={removing === c.id}
                onClick={() => void handleUnlink(c.id)}
                className="text-slate-400 hover:text-red-500 p-2"
                aria-label="Retirer"
              >
                {removing === c.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

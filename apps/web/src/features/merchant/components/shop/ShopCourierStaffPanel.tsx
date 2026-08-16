'use client'

import { useEffect, useState } from 'react'
import { Loader2, Trash2, UserPlus, Users } from 'lucide-react'
import {
  fetchMerchantCourierStaff,
  fetchMerchantFleetInviteLink,
  fetchShopCourierStaff,
  fetchShopFleetInviteLink,
  linkMerchantCourierStaff,
  linkShopCourierStaff,
  unlinkMerchantCourierStaff,
  unlinkShopCourierStaff,
  type ShopCourierStaff,
} from '@/lib/deliveryStakeholdersApi'
import { LogisticsFleetInviteCard } from '@/features/logistics/components/LogisticsFleetInviteCard'
import { notify } from '@/lib/notify'
import type { DeliveryHubScope } from '@/features/merchant/components/delivery/deliveryHubScope'

export function ShopCourierStaffPanel({ merchantId, shopId }: DeliveryHubScope) {
  const [staff, setStaff] = useState<ShopCourierStaff[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [linking, setLinking] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [invite, setInvite] = useState<{ url: string; shop_name: string } | null>(null)

  const load = async () => {
    if (!merchantId && !shopId) return
    setLoading(true)
    const list = shopId
      ? await fetchShopCourierStaff(shopId)
      : await fetchMerchantCourierStaff(merchantId!)
    setStaff(list)
    setLoading(false)
  }

  useEffect(() => {
    void load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantId, shopId])

  useEffect(() => {
    if (!merchantId && !shopId) return
    void (shopId
      ? fetchShopFleetInviteLink(shopId)
      : fetchMerchantFleetInviteLink(merchantId!)
    ).then(data => {
      if (data) setInvite({ url: data.url, shop_name: data.shop_name })
    })
  }, [merchantId, shopId])

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!merchantId && !shopId) || !email.trim()) return
    setLinking(true)
    const { staff: linked, error } = shopId
      ? await linkShopCourierStaff(shopId, email.trim())
      : await linkMerchantCourierStaff(merchantId!, email.trim())
    setLinking(false)
    if (error) {
      notify.error(error)
      return
    }
    if (linked) {
      notify.success('Livreur ajouté à votre flotte')
      setEmail('')
      void load()
    }
  }

  const handleUnlink = async (profileId: string) => {
    if (!merchantId && !shopId) return
    setRemoving(profileId)
    const { ok, error } = shopId
      ? await unlinkShopCourierStaff(shopId, profileId)
      : await unlinkMerchantCourierStaff(merchantId!, profileId)
    setRemoving(null)
    if (!ok) {
      notify.error(error ?? 'Erreur')
      return
    }
    notify.success('Livreur retiré de la flotte')
    void load()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <Users size={22} className="text-brand-500" /> Ma flotte
        </h2>
        <p className="text-slate-500 text-sm mt-1 max-w-2xl">
          Invitez vos livreurs salariés ou prestataires. Ils recevront les courses en mode « Ma flotte » via l&apos;app LaPlasse Livraison.
        </p>
      </div>

      {invite ? (
        <LogisticsFleetInviteCard url={invite.url} label={invite.shop_name} />
      ) : null}

      <form onSubmit={e => void handleLink(e)} className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
        <label className="block text-sm font-bold text-slate-900">Ajouter un livreur par e-mail</label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="livreur@exemple.com"
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm"
            required
          />
          <button
            type="submit"
            disabled={linking}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 shrink-0"
          >
            {linking ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
            Ajouter
          </button>
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-slate-300" size={28} />
        </div>
      ) : staff.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-sm text-slate-500">
          Aucun livreur dans votre flotte pour le moment.
        </div>
      ) : (
        <ul className="space-y-3">
          {staff.map(member => (
            <li
              key={member.id}
              className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <p className="font-bold text-slate-900">{member.full_name ?? member.email}</p>
                <p className="text-sm text-slate-500">{member.email}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {member.is_online ? 'En ligne' : 'Hors ligne'} · {member.vehicle ?? 'Véhicule non renseigné'}
                </p>
              </div>
              <button
                type="button"
                disabled={removing === member.id}
                onClick={() => void handleUnlink(member.id)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50"
              >
                {removing === member.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Retirer
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Check,
  Circle,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Package,
  Rocket,
  Share2,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { fetchMyProducts } from '@/lib/marketplaceApi'
import {
  fetchShopForManage,
  getShopPublicHref,
  getShopRoutesFromPathname,
  updateShop,
  type ShopStatus,
} from '@/lib/shopApi'
import { notify } from '@/lib/notify'

const MIN_PRODUCTS = 3

interface WizardStep {
  id: string
  label: string
  desc: string
  done: boolean
  href?: string
  action?: () => void
  actionLabel?: string
}

export function ShopPublishWizard() {
  const pathname = usePathname()
  const routes = getShopRoutesFromPathname(pathname)
  const { user, activeShopId, updateUser } = useAuthStore()
  const activeShop = user?.shops?.find(s => s.id === activeShopId)
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(false)
  const [logo, setLogo] = useState<string | null>(null)
  const [status, setStatus] = useState<ShopStatus>('DRAFT')
  const [activeProducts, setActiveProducts] = useState(0)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    if (!activeShopId) {
      setLoading(false)
      return
    }
    setLoading(true)
    const [shop, products] = await Promise.all([
      fetchShopForManage(activeShopId),
      fetchMyProducts(activeShopId),
    ])
    if (shop) {
      setLogo(shop.logo ?? null)
      setStatus(shop.status)
    }
    setActiveProducts(products.filter(p => p.status === 'ACTIVE' || p.status === 'PENDING_REVIEW').length)
    setLoading(false)
  }, [activeShopId])

  useEffect(() => { load() }, [load])

  const hasLogo = !!logo
  const hasEnoughProducts = activeProducts >= MIN_PRODUCTS
  const isActive = status === 'ACTIVE'
  const isPendingReview = status === 'PENDING_REVIEW'

  const boutiqueUrl = useMemo(() => {
    if (typeof window === 'undefined' || !activeShop?.slug) return ''
    return `${window.location.origin}${getShopPublicHref(activeShop)}`
  }, [activeShop])

  const activateShop = async () => {
    if (!activeShopId || !hasLogo || !hasEnoughProducts) return
    setActivating(true)
    const { shop, error } = await updateShop(activeShopId, { status: 'PENDING_REVIEW' })
    setActivating(false)
    if (error || !shop) {
      notify.error(error ?? 'Impossible de soumettre la boutique')
      return
    }
    setStatus('PENDING_REVIEW')
    updateUser({
      shops: (user?.shops ?? []).map(s =>
        s.id === shop.id ? { ...s, status: shop.status } : s,
      ),
    })
    notify.success('Boutique soumise — validation admin en cours')
  }

  const copyLink = async () => {
    if (!boutiqueUrl) return
    try {
      await navigator.clipboard.writeText(boutiqueUrl)
      setCopied(true)
      notify.success('Lien copié')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      notify.error('Copie impossible')
    }
  }

  const steps: WizardStep[] = [
    {
      id: 'logo',
      label: 'Ajouter un logo',
      desc: 'Donnez une identité visuelle à votre boutique',
      done: hasLogo,
      href: routes.settings,
      actionLabel: 'Ajouter le logo',
    },
    {
      id: 'products',
      label: `Publier ${MIN_PRODUCTS} produits minimum`,
      desc: `${activeProducts}/${MIN_PRODUCTS} produit${activeProducts > 1 ? 's' : ''} actif${activeProducts > 1 ? 's' : ''}`,
      done: hasEnoughProducts,
      href: routes.productsNew,
      actionLabel: activeProducts === 0 ? 'Créer un produit' : 'Ajouter un produit',
    },
    {
      id: 'activate',
      label: isPendingReview ? 'Validation en cours' : 'Soumettre la boutique',
      desc: isPendingReview
        ? 'Notre équipe examine votre vitrine'
        : 'Demander la mise en ligne sur LaPlasse',
      done: isActive,
      action: hasLogo && hasEnoughProducts && !isActive && !isPendingReview ? activateShop : undefined,
      actionLabel: activating ? 'Envoi…' : isPendingReview ? 'En attente' : 'Soumettre à validation',
    },
    {
      id: 'share',
      label: 'Partager votre lien',
      desc: 'Envoyez le lien à vos clients',
      done: isActive && !!boutiqueUrl,
      action: isActive ? copyLink : undefined,
      actionLabel: copied ? 'Copié !' : 'Copier le lien',
    },
  ]

  const completedCount = steps.filter(s => s.done).length
  const allDone = completedCount === steps.length

  if (loading) {
    return (
      <div className="bg-white border border-slate-100 rounded-xl p-8 flex justify-center">
        <Loader2 size={22} className="animate-spin text-slate-300" />
      </div>
    )
  }

  if (!activeShop) return null

  if (isPendingReview && !isActive) {
    return (
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-6 sm:p-8">
        <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">
          Validation en cours
        </p>
        <h2 className="text-xl font-extrabold text-slate-900 mb-2">
          {activeShop.name} est en examen
        </h2>
        <p className="text-sm text-amber-800/80">
          Notre équipe vérifie votre boutique. Vous serez notifié dès qu&apos;elle sera en ligne.
        </p>
      </div>
    )
  }

  if (allDone) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
              Boutique en ligne
            </p>
            <h2 className="text-xl font-extrabold text-slate-900 mb-1">
              {activeShop.name} est publiée
            </h2>
            <p className="text-sm text-slate-500 truncate max-w-md">{boutiqueUrl}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 text-white text-sm font-bold hover:bg-brand-500 transition-colors"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copié' : 'Copier le lien'}
            </button>
            {boutiqueUrl && (
              <Link
                href={getShopPublicHref(activeShop)}
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-slate-200 text-sm font-bold text-slate-700 hover:border-brand-300 transition-colors"
                style={{ textDecoration: 'none' }}
              >
                <ExternalLink size={16} /> Voir
              </Link>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-brand-50/80 to-amber-50/50">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center shrink-0">
            <Rocket size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-extrabold text-slate-900">Publier ma boutique</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {completedCount}/{steps.length} étapes — checklist avant mise en ligne
            </p>
          </div>
        </div>
        <div className="mt-4 h-2 bg-white/80 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <ul className="divide-y divide-slate-100">
        {steps.map(step => (
          <li key={step.id} className="px-6 py-4 flex items-start gap-4">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                step.done
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {step.done ? (
                <Check size={16} strokeWidth={3} />
              ) : step.id === 'logo' ? (
                <ImageIcon size={15} />
              ) : step.id === 'products' ? (
                <Package size={15} />
              ) : step.id === 'share' ? (
                <Share2 size={15} />
              ) : (
                <Circle size={14} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className={`font-bold text-sm ${step.done ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                {step.label}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">{step.desc}</p>
            </div>

            {!step.done && (
              <div className="shrink-0">
                {step.action ? (
                  <button
                    type="button"
                    onClick={step.action}
                    disabled={step.id === 'activate' && (activating || !hasLogo || !hasEnoughProducts)}
                    className="text-xs font-bold px-3 py-2 rounded-full bg-slate-900 text-white hover:bg-brand-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {step.id === 'activate' && activating ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Loader2 size={12} className="animate-spin" /> Activation…
                      </span>
                    ) : (
                      step.actionLabel
                    )}
                  </button>
                ) : step.href ? (
                  <Link
                    href={step.href}
                    className="text-xs font-bold px-3 py-2 rounded-full border border-slate-200 text-slate-700 hover:border-brand-300 transition-colors inline-block"
                    style={{ textDecoration: 'none' }}
                  >
                    {step.actionLabel}
                  </Link>
                ) : null}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

'use client'

import type { FulfilmentMode } from '@/lib/deliveryFulfilmentModes'
import { fulfilmentPricingExplanation, merchantZonesApplyAtCheckout } from '@/lib/deliveryFulfilmentModes'

interface Props {
  mode: FulfilmentMode
  zoneCount: number
}

export function FulfilmentPricingBanner({ mode, zoneCount }: Props) {
  const info = fulfilmentPricingExplanation(mode)
  const zonesActive = merchantZonesApplyAtCheckout(mode)

  return (
    <div className={`rounded-2xl border p-4 space-y-3 ${
      zonesActive
        ? zoneCount > 0
          ? 'bg-emerald-50 border-emerald-100'
          : 'bg-amber-50 border-amber-100'
        : 'bg-slate-50 border-slate-200'
    }`}>
      <div>
        <p className="text-sm font-bold text-slate-900">{info.title}</p>
        <ul className="mt-2 space-y-1">
          {info.steps.map(step => (
            <li key={step} className="text-xs text-slate-600 leading-relaxed">
              {step}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs font-medium text-slate-700">{info.zonesHint}</p>
      {zonesActive && zoneCount === 0 && (
        <p className="text-xs font-bold text-amber-800">
          Aucune zone — la livraison sera indisponible tant qu&apos;une zone n&apos;est pas configurée.
        </p>
      )}
    </div>
  )
}

'use client'

interface BookingPaymentSettings {
  require_payment?: boolean
  deposit_percent?: number
}

export function BookingPaymentSettingsFields({
  settings,
  onChange,
}: {
  settings: BookingPaymentSettings
  onChange: (patch: Partial<BookingPaymentSettings>) => void
}) {
  const requirePayment = settings.require_payment ?? false
  const depositPercent = settings.deposit_percent ?? 100

  return (
    <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-900">Paiement à la réservation</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Le client paie un acompte (simulateur) avant confirmation. Connexion obligatoire.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={requirePayment}
          onClick={() => onChange({ require_payment: !requirePayment })}
          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
            requirePayment ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              requirePayment ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {requirePayment && (
        <label className="block">
          <span className="text-xs font-bold text-slate-500">Acompte (% du montant)</span>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={depositPercent}
              onChange={e => onChange({ deposit_percent: Number(e.target.value) })}
              className="flex-1 accent-emerald-600"
            />
            <span className="text-sm font-bold text-slate-900 w-12 text-right">{depositPercent}%</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Ex. séjour 100 000 F → {Math.round(100000 * depositPercent / 100).toLocaleString('fr-FR')} F à payer.
          </p>
        </label>
      )}
    </div>
  )
}

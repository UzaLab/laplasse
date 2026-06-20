import { cn } from '@/lib/utils'

interface CheckoutStepsProps {
  current: 1 | 2 | 3 | 4
}

const STEPS = [
  { n: 1, label: 'Panier' },
  { n: 2, label: 'Livraison' },
  { n: 3, label: 'Paiement' },
  { n: 4, label: 'Confirmation' },
] as const

export function CheckoutSteps({ current }: CheckoutStepsProps) {
  return (
    <div className="pt-28 pb-8 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-center max-w-2xl mx-auto">
          {STEPS.map((step, index) => (
            <div key={step.n} className="contents">
              <div className="flex flex-col items-center gap-2 relative z-10">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors',
                    current >= step.n
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                      : 'bg-slate-100 text-slate-400',
                  )}
                >
                  {step.n}
                </div>
                <span
                  className={cn(
                    'text-xs font-bold uppercase tracking-wider',
                    current >= step.n ? 'text-slate-900' : 'text-slate-400',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-1 mx-[-10px] z-0 rounded-full',
                    current > step.n ? 'bg-slate-900' : 'bg-slate-100',
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getCheckoutConfirmation, getCheckoutSession } from '@/lib/checkoutSession'

interface FoodCheckoutStepsProps {
  current: 1 | 2 | 3 | 4
}

const STEPS = [
  { n: 1 as const, label: 'Ma commande', href: '/commande' },
  { n: 2 as const, label: 'Livraison', href: '/commande/livraison' },
  { n: 3 as const, label: 'Paiement', href: '/commande/paiement' },
  { n: 4 as const, label: 'Confirmation', href: '/checkout/confirmation' },
]

function canNavigateToStep(step: number, current: number): boolean {
  if (step <= 2) return step <= current
  if (step === 3) return current >= 3 || !!getCheckoutSession()
  if (step === 4) return current >= 4 || !!getCheckoutConfirmation()
  return false
}

function stepHref(step: typeof STEPS[number]): string {
  if (step.n === 4) {
    const conf = getCheckoutConfirmation()
    if (conf) {
      const ids = conf.orderIds.join(',')
      return `/checkout/confirmation?status=${conf.status}&orderIds=${ids}&flow=food`
    }
  }
  return step.href
}

export function FoodCheckoutSteps({ current }: FoodCheckoutStepsProps) {
  const router = useRouter()

  return (
    <div className="pt-28 pb-8 bg-white border-b border-orange-100/80">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-center max-w-2xl mx-auto">
          {STEPS.map((step, index) => {
            const clickable = canNavigateToStep(step.n, current)
            const href = stepHref(step)
            const isCurrent = step.n === current

            const circle = (
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors',
                  current >= step.n
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20'
                    : 'bg-slate-100 text-slate-400',
                  clickable && !isCurrent && 'hover:ring-2 hover:ring-orange-200 cursor-pointer',
                  isCurrent && 'ring-2 ring-orange-400 ring-offset-2',
                )}
              >
                {step.n}
              </div>
            )

            const label = (
              <span
                className={cn(
                  'text-xs font-bold uppercase tracking-wider',
                  current >= step.n ? 'text-slate-900' : 'text-slate-400',
                  clickable && 'hover:text-orange-600',
                )}
              >
                {step.label}
              </span>
            )

            return (
              <div key={step.n} className="contents">
                <div className="flex flex-col items-center gap-2 relative z-10">
                  {clickable && !isCurrent ? (
                    <Link href={href} style={{ textDecoration: 'none' }} className="flex flex-col items-center gap-2">
                      {circle}
                      {label}
                    </Link>
                  ) : (
                    <>
                      {circle}
                      {label}
                    </>
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <button
                    type="button"
                    aria-hidden
                    tabIndex={-1}
                    onClick={() => {
                      if (canNavigateToStep(step.n + 1, current)) {
                        router.push(stepHref(STEPS[index + 1]))
                      }
                    }}
                    className={cn(
                      'flex-1 h-1 mx-[-10px] z-0 rounded-full border-0 p-0',
                      current > step.n ? 'bg-orange-600' : 'bg-slate-100',
                      canNavigateToStep(step.n + 1, current) && 'cursor-pointer hover:opacity-80',
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

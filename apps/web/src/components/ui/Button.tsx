'use client'

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

const VARIANT_CLASS = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 border border-transparent shadow-sm',
  secondary: 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 hover:border-slate-300',
  dark: 'bg-slate-900 text-white hover:bg-slate-800 border border-transparent',
  accent: 'bg-orange-600 text-white hover:bg-orange-700 border border-transparent',
  admin: 'bg-violet-600 text-white hover:bg-violet-700 border border-transparent',
  ghost: 'bg-transparent text-slate-600 border border-transparent hover:bg-slate-100',
  danger: 'bg-red-600 text-white hover:bg-red-700 border border-transparent',
  dangerOutline: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 border border-transparent',
} as const

const SIZE_CLASS = {
  xs: 'h-8 px-3 text-xs gap-1',
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
  xl: 'h-12 px-6 text-base gap-2',
  icon: 'h-9 w-9 p-0 gap-0',
  iconSm: 'h-8 w-8 p-0 gap-0',
  iconLg: 'h-11 w-11 p-0 gap-0',
} as const

export type ButtonVariant = keyof typeof VARIANT_CLASS
export type ButtonSize = keyof typeof SIZE_CLASS

function cn(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(' ')
}

const BASE =
  'btn inline-flex items-center justify-center font-bold transition-colors rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  const isIconOnly = size.startsWith('icon')

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(BASE, VARIANT_CLASS[variant], SIZE_CLASS[size], fullWidth && 'w-full', className)}
      {...props}
    >
      {loading ? <Loader2 size={isIconOnly ? 16 : 15} className="animate-spin shrink-0" /> : leftIcon}
      {!isIconOnly && children ? <span className="truncate">{children}</span> : !loading ? children : null}
      {!loading && rightIcon}
    </button>
  )
})

export type ButtonLinkProps = {
  href: string
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
  external?: boolean
  className?: string
  children?: ReactNode
} & Omit<React.ComponentPropsWithoutRef<typeof Link>, 'href' | 'children'>

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className,
  children,
  href,
  external,
  ...props
}: ButtonLinkProps) {
  const classes = cn(BASE, VARIANT_CLASS[variant], SIZE_CLASS[size], fullWidth && 'w-full', className)
  const isIconOnly = size.startsWith('icon')
  const content = (
    <>
      {loading ? <Loader2 size={isIconOnly ? 16 : 15} className="animate-spin shrink-0" /> : leftIcon}
      {!isIconOnly && children ? <span className="truncate">{children}</span> : !loading ? children : null}
      {!loading && rightIcon}
    </>
  )

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} style={{ textDecoration: 'none' }}>
        {content}
      </a>
    )
  }

  return (
    <Link href={href} className={classes} style={{ textDecoration: 'none' }} {...props}>
      {content}
    </Link>
  )
}

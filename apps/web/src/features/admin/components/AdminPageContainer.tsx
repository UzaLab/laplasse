import { cn } from '@/lib/utils'

interface AdminPageContainerProps {
  children: React.ReactNode
  className?: string
  /** Pages très larges (geo) — max-w-6xl */
  wide?: boolean
}

/** Largeur standard alignée sur les pages admin delivery / merchants. */
export function AdminPageContainer({ children, className, wide }: AdminPageContainerProps) {
  return (
    <div className={cn('w-full mx-auto space-y-6', wide ? 'max-w-6xl' : 'max-w-5xl', className)}>
      {children}
    </div>
  )
}

interface AdminPageHeaderProps {
  title: string
  description?: string
  icon?: React.ReactNode
  actions?: React.ReactNode
}

export function AdminPageHeader({ title, description, icon, actions }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          {icon}
          {title}
        </h1>
        {description && <p className="text-slate-500 text-sm mt-1">{description}</p>}
      </div>
      {actions}
    </div>
  )
}

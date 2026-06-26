import { cn } from '@/lib/utils'

interface AdminPageContainerProps {
  children: React.ReactNode
  className?: string
}

/** Largeur pleine — alignée sur /shop/manage et les shells marchands. */
export function AdminPageContainer({ children, className }: AdminPageContainerProps) {
  return (
    <div className={cn('w-full space-y-6', className)}>
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

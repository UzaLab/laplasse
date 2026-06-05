import Link from 'next/link'

interface SectionHeaderProps {
  title: string
  linkLabel?: string
  linkHref?: string
}

export function SectionHeader({ title, linkLabel, linkHref }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <h2 className="font-bold" style={{ fontSize: '20px', color: 'var(--text-main)' }}>
        {title}
      </h2>
      {linkLabel && linkHref && (
        <Link
          href={linkHref}
          className="font-semibold no-underline"
          style={{ fontSize: '14px', color: 'var(--primary)' }}
        >
          {linkLabel}
        </Link>
      )}
    </div>
  )
}

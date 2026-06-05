import { BottomNav } from '@/components/layout/BottomNav'

export default function ActivitePage() {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--background)' }}>
      <div className="mx-auto flex w-full flex-col" style={{ maxWidth: '480px', minHeight: '100vh' }}>
        <main className="flex-1 pb-24">
          <div style={{ padding: '48px 24px' }}>
            <h1 className="font-bold text-2xl mb-2" style={{ color: 'var(--text-main)' }}>Activité</h1>
            <p style={{ color: 'var(--text-muted)' }}>— À implémenter (V0.5)</p>
          </div>
        </main>
        <div className="md:hidden"><BottomNav /></div>
      </div>
    </div>
  )
}

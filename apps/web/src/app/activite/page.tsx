import { Navbar } from '@/components/layout/Navbar'
import { MOBILE_BOTTOM_NAV_PAD, NAVBAR_TOP_PAD_LOOSE } from '@/lib/mobilePublicChrome'
import { cn } from '@/lib/utils'

export default function ActivitePage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <main className={cn(NAVBAR_TOP_PAD_LOOSE, MOBILE_BOTTOM_NAV_PAD, 'px-6 max-w-lg mx-auto')}>
        <h1 className="font-extrabold text-2xl text-slate-900 mb-2">Activité</h1>
        <p className="text-slate-500">Historique unifié — réservations, commandes et livraisons (à venir).</p>
      </main>
    </div>
  )
}

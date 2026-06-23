import { Navbar } from '@/components/layout/Navbar'
import { MobileBottomNav } from '@/components/layout/MobileBottomNav'

export default function ActivitePage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />
      <main className="pt-28 pb-24 px-6 max-w-lg mx-auto">
        <h1 className="font-extrabold text-2xl text-slate-900 mb-2">Activité</h1>
        <p className="text-slate-500">Historique unifié — réservations, commandes et livraisons (à venir).</p>
      </main>
      <MobileBottomNav />
    </div>
  )
}

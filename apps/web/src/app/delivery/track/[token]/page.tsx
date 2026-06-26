import { Navbar } from '@/components/layout/Navbar'
import { AppFooter } from '@/components/layout/AppFooter'
import { MOBILE_BOTTOM_NAV_PAD, NAVBAR_TOP_PAD_LOOSE } from '@/lib/mobilePublicChrome'
import { DeliveryTrackClient } from '@/features/delivery/components/DeliveryTrackClient'

interface Props {
  params: Promise<{ token: string }>
}

export default async function DeliveryTrackPage({ params }: Props) {
  const { token } = await params

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className={`flex-1 ${NAVBAR_TOP_PAD_LOOSE} ${MOBILE_BOTTOM_NAV_PAD}`}>
        <DeliveryTrackClient token={token} />
      </main>
      <AppFooter />
    </div>
  )
}

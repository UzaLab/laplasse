import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { DeliveryTrackClient } from '@/features/delivery/components/DeliveryTrackClient'

interface Props {
  params: Promise<{ token: string }>
}

export default async function DeliveryTrackPage({ params }: Props) {
  const { token } = await params

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 md:pt-28">
        <DeliveryTrackClient token={token} />
      </main>
      <Footer />
    </div>
  )
}

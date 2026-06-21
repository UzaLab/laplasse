import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ slug: string }>
}

/** Legacy — menu intégré dans la fiche via onglet */
export default async function MerchantMenuRedirectPage({ params }: Props) {
  const { slug } = await params
  redirect(`/m/${slug}?tab=menu#profile-tabs`)
}

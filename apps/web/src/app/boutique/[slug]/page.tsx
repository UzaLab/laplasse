import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ slug: string }>
}

/** Redirection legacy → URL unifiée /m/{slug}/boutique */
export default async function BoutiqueLegacyRedirect({ params }: Props) {
  const { slug } = await params
  redirect(`/m/${slug}/boutique`)
}

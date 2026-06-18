import { redirect } from 'next/navigation'

export default async function LegacyEditProductRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/merchant/shop/products/${id}/edit`)
}

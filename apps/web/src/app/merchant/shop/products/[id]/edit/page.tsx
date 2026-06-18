'use client'

import { use } from 'react'
import { MerchantProductForm } from '@/features/merchant/components/MerchantProductForm'

export default function EditShopProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return <MerchantProductForm productId={id} />
}

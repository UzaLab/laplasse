'use client'

import { use } from 'react'
import { MerchantProductForm } from '@/features/merchant/components/MerchantProductForm'

export default function EditMerchantProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  return <MerchantProductForm productId={id} />
}

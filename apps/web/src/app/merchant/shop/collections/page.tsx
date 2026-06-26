import { redirect } from 'next/navigation'

export default function MerchantShopCollectionsPage() {
  redirect('/merchant/shop/products?tab=collections')
}

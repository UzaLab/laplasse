import { redirect } from 'next/navigation'

export default function ShopManageCollectionsPage() {
  redirect('/shop/manage/products?tab=collections')
}

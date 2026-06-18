import { redirect } from 'next/navigation'

export default function LegacyProductsRedirect() {
  redirect('/merchant/shop/products')
}

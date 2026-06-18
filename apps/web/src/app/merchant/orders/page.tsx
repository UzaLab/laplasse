import { redirect } from 'next/navigation'

export default function LegacyOrdersRedirect() {
  redirect('/merchant/shop/orders')
}

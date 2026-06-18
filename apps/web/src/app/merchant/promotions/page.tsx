import { redirect } from 'next/navigation'

export default function LegacyPromotionsRedirect() {
  redirect('/merchant/shop/promotions')
}

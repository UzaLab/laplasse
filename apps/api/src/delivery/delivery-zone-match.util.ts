import { PrismaService } from '../prisma/prisma.service'

type OrderGeoContext = {
  delivery_city_id: string | null
  delivery_commune_id: string | null
  shop: { city: string | null; country: string | null } | null
  merchant?: { location?: { country: string | null } | null } | null
}

/** Résout le pays ISO-2 d'une commande (shop → merchant → ville de livraison). */
export async function resolveOrderCountry(
  prisma: PrismaService,
  order: OrderGeoContext,
): Promise<string | null> {
  if (order.shop?.country) return order.shop.country.toUpperCase()
  if (order.merchant?.location?.country) return order.merchant.location.country.toUpperCase()
  if (order.delivery_city_id) {
    const city = await prisma.geoCity.findUnique({
      where: { id: order.delivery_city_id },
      select: { country: true },
    })
    return city?.country?.toUpperCase() ?? null
  }
  return null
}

/**
 * Vérifie si une commande est dans la zone de service d'un livreur.
 * Utilisé à la fois par l'offer service et le courier-jobs service.
 */
export async function orderMatchesZones(
  prisma: PrismaService,
  order: OrderGeoContext,
  profileId: string,
  profileCountry: string,
): Promise<boolean> {
  const orderCountry = await resolveOrderCountry(prisma, order)
  if (orderCountry && orderCountry !== profileCountry.toUpperCase()) {
    return false
  }

  const zones = await prisma.courierServiceZone.findMany({
    where: { courier_id: profileId, is_active: true },
    include: {
      communes: { select: { commune_id: true } },
      city: { select: { id: true, name: true, slug: true, country: true } },
    },
  })
  if (!zones.length) return false

  if (order.delivery_city_id) {
    for (const zone of zones) {
      if (zone.city_id !== order.delivery_city_id) continue
      if (zone.all_communes) return true
      if (
        order.delivery_commune_id
        && zone.communes.some(c => c.commune_id === order.delivery_commune_id)
      ) {
        return true
      }
    }
    return false
  }

  const shopCity = order.shop?.city?.toLowerCase().trim()
  if (!shopCity) return false
  return zones.some(z => {
    const name = z.city.name.toLowerCase()
    const slug = z.city.slug.toLowerCase()
    return shopCity.includes(name) || name.includes(shopCity) || shopCity === slug
  })
}

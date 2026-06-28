export type FulfilmentMode = 'PLATFORM_RIDER' | 'MERCHANT_OWN' | 'LOGISTICS_PARTNER'

export const FULFILMENT_MODES: Array<{
  value: FulfilmentMode
  label: string
  shortDesc: string
}> = [
  {
    value: 'PLATFORM_RIDER',
    label: 'Réseau LaPlasse',
    shortDesc: 'Livreurs indépendants assignés automatiquement par la plateforme.',
  },
  {
    value: 'MERCHANT_OWN',
    label: 'Ma flotte',
    shortDesc: 'Vos livreurs internes — tarifs et zones que vous configurez.',
  },
  {
    value: 'LOGISTICS_PARTNER',
    label: 'Partenaire logistique',
    shortDesc: 'Externalisation via un prestataire avec contrat actif.',
  },
]

/** Les zones du marchand ne s'appliquent au checkout que en mode « Ma flotte ». */
export function merchantZonesApplyAtCheckout(mode: FulfilmentMode): boolean {
  return mode === 'MERCHANT_OWN'
}

export function fulfilmentPricingExplanation(mode: FulfilmentMode): {
  title: string
  steps: string[]
  zonesHint: string
} {
  switch (mode) {
    case 'MERCHANT_OWN':
      return {
        title: 'Tarification — Ma flotte',
        steps: [
          'Vos zones de livraison déterminent le tarif et le délai affichés au client.',
          'Si plusieurs zones couvrent la même adresse : priorité la plus haute (champ priority), puis couverture la plus précise (commune > ville entière).',
        ],
        zonesHint: 'Configurez au moins une zone couvrant vos communes de livraison.',
      }
    case 'LOGISTICS_PARTNER':
      return {
        title: 'Tarification — Partenaire logistique',
        steps: [
          '1. Forfait du contrat actif (si défini par le partenaire).',
          '2. Sinon, zones tarifaires du partenaire logistique pour l\'adresse du client.',
          '3. Sinon, livraison indisponible — vos zones personnelles ne remplacent pas le partenaire.',
        ],
        zonesHint: 'Vos zones ci-dessous servent uniquement si vous repassez en mode « Ma flotte ». Signez un contrat et demandez au partenaire de configurer ses zones.',
      }
    case 'PLATFORM_RIDER':
    default:
      return {
        title: 'Tarification — Réseau LaPlasse',
        steps: [
          '1. Grille tarifaire admin LaPlasse (commune, puis ville).',
          '2. Sinon, tarif fallback pays (restaurants uniquement).',
          'Vos zones personnelles ne sont pas utilisées tant que ce mode est actif.',
        ],
        zonesHint: 'Préparez vos zones pour basculer en « Ma flotte » sans reconfiguration ultérieure.',
      }
  }
}

import { computeCampaignAmount } from './ad-pricing'

describe('computeCampaignAmount', () => {
  it('applique le coefficient produit (×0.7)', () => {
    expect(computeCampaignAmount('PRODUCT', 'MARKETPLACE_FEATURED_PRODUCTS', 7)).toBe(8820)
  })

  it('applique le coefficient établissement (×1.2)', () => {
    expect(computeCampaignAmount('MERCHANT', 'SEARCH', 7)).toBe(18000)
  })

  it('conserve le tarif boutique (×1.0)', () => {
    expect(computeCampaignAmount('SHOP', 'MARKETPLACE', 14)).toBe(30000)
  })

  it('retourne null pour une durée invalide', () => {
    expect(computeCampaignAmount('SHOP', 'MARKETPLACE', 99)).toBeNull()
  })
})

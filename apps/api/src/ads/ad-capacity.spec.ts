import { AdPlacement } from '../../generated/prisma/client'
import { DEFAULT_PLACEMENT_CAPACITY } from './ad-capacity'

describe('ad-capacity', () => {
  it('définit des limites par emplacement', () => {
    expect(DEFAULT_PLACEMENT_CAPACITY.SEARCH).toBe(3)
    expect(DEFAULT_PLACEMENT_CAPACITY.FEATURED).toBe(6)
    expect(DEFAULT_PLACEMENT_CAPACITY.MARKETPLACE).toBe(8)
  })

  it('couvre tous les placements', () => {
    const keys = Object.keys(DEFAULT_PLACEMENT_CAPACITY) as AdPlacement[]
    expect(keys).toContain('MARKETPLACE_FEATURED_PRODUCTS')
    expect(keys.length).toBe(5)
  })
})

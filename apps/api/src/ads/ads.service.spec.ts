import { NotFoundException } from '@nestjs/common'
import { AdsService } from './ads.service'
import { PrismaService } from '../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'

describe('AdsService', () => {
  let service: AdsService
  let prisma: {
    adCampaign: {
      findFirst: jest.Mock
      update: jest.Mock
      findMany: jest.Mock
      count: jest.Mock
      create: jest.Mock
    }
    paymentTransaction: {
      findFirst: jest.Mock
      update: jest.Mock
      create: jest.Mock
    }
    platformSetting: { findUnique: jest.Mock }
    $transaction: jest.Mock
    merchant: { update: jest.Mock; count: jest.Mock }
  }
  let audit: { log: jest.Mock }

  beforeEach(() => {
    prisma = {
      adCampaign: {
        findFirst: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn(),
      },
      paymentTransaction: {
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      platformSetting: { findUnique: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
      merchant: {
        update: jest.fn(),
        count: jest.fn().mockResolvedValue(1),
      },
    }
    audit = { log: jest.fn().mockResolvedValue(undefined) }

    service = new AdsService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
    )
    jest.clearAllMocks()
  })

  describe('recordEvent', () => {
    it('incrémente les impressions pour une campagne active', async () => {
      prisma.adCampaign.findFirst.mockResolvedValue({ id: 'c1', status: 'ACTIVE' })
      prisma.adCampaign.update.mockResolvedValue({})

      const result = await service.recordEvent('c1', 'impression')

      expect(result).toEqual({ ok: true })
      expect(prisma.adCampaign.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { impressions: { increment: 1 } },
      })
    })

    it('ignore les campagnes inexistantes ou inactives', async () => {
      prisma.adCampaign.findFirst.mockResolvedValue(null)

      const result = await service.recordEvent('missing', 'click')

      expect(result).toEqual({ ok: false })
      expect(prisma.adCampaign.update).not.toHaveBeenCalled()
    })
  })

  describe('confirmAdPayment', () => {
    it('rejette un paiement introuvable', async () => {
      prisma.paymentTransaction.findFirst.mockResolvedValue(null)

      await expect(
        service.confirmAdPayment('user-1', 'pay-1', 'success'),
      ).rejects.toBeInstanceOf(NotFoundException)
    })

    it('active la campagne après paiement réussi', async () => {
      prisma.paymentTransaction.findFirst.mockResolvedValue({
        id: 'pay-1',
        user_id: 'user-1',
        purpose: 'AD_CAMPAIGN',
        status: 'PENDING',
        amount: 18000,
      })
      prisma.adCampaign.findFirst.mockResolvedValue({
        id: 'camp-1',
        merchant_id: 'm1',
        placement: 'SEARCH',
        target_type: 'MERCHANT',
        duration_days: 7,
      })

      const result = await service.confirmAdPayment('user-1', 'pay-1', 'success')

      expect(result.status).toBe('SUCCESS')
      expect(prisma.paymentTransaction.update).toHaveBeenCalled()
      expect(prisma.adCampaign.update).toHaveBeenCalledWith({
        where: { id: 'camp-1' },
        data: expect.objectContaining({
          status: 'ACTIVE',
          waitlist_position: null,
        }),
      })
      expect(audit.log).toHaveBeenCalled()
    })

    it('annule la campagne si le paiement échoue', async () => {
      prisma.paymentTransaction.findFirst.mockResolvedValue({
        id: 'pay-1',
        user_id: 'user-1',
        purpose: 'AD_CAMPAIGN',
        status: 'PENDING',
        amount: 18000,
      })
      prisma.adCampaign.findFirst
        .mockResolvedValueOnce({
          id: 'camp-1',
          merchant_id: 'm1',
          placement: 'SEARCH',
          target_type: 'MERCHANT',
          duration_days: 7,
        })
        .mockResolvedValue(null)
      prisma.adCampaign.findMany.mockResolvedValue([])

      const result = await service.confirmAdPayment('user-1', 'pay-1', 'failure')

      expect(result.status).toBe('FAILED')
      expect(prisma.adCampaign.update).toHaveBeenCalledWith({
        where: { id: 'camp-1' },
        data: { status: 'CANCELLED' },
      })
    })
  })

  describe('getPlacementAvailability', () => {
    it('calcule les places restantes', async () => {
      prisma.adCampaign.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(2)

      const result = await service.getPlacementAvailability('SEARCH')

      expect(result.capacity).toBe(3)
      expect(result.active).toBe(3)
      expect(result.waitlist).toBe(2)
      expect(result.available_slots).toBe(0)
      expect(result.is_saturated).toBe(true)
    })
  })
})

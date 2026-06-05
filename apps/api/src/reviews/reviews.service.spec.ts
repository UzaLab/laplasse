import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import { ReviewsService } from './reviews.service'
import { PrismaService } from '../prisma/prisma.service'

describe('ReviewsService', () => {
  let service: ReviewsService
  let prisma: {
    merchant: { findUnique: jest.Mock }
    review: {
      findFirst: jest.Mock
      findMany: jest.Mock
      create: jest.Mock
    }
  }

  beforeEach(() => {
    prisma = {
      merchant: { findUnique: jest.fn() },
      review: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
    }
    service = new ReviewsService(prisma as unknown as PrismaService)
  })

  describe('create', () => {
    it('rejette une note hors plage', async () => {
      await expect(
        service.create({ merchant_id: 'm1', rating: 6 }, 'u1'),
      ).rejects.toThrow(BadRequestException)
    })

    it('rejette si le marchand est introuvable', async () => {
      prisma.merchant.findUnique.mockResolvedValue(null)

      await expect(
        service.create({ merchant_id: 'm1', rating: 5 }, 'u1'),
      ).rejects.toThrow(NotFoundException)
    })

    it('rejette un second avis du même utilisateur', async () => {
      prisma.merchant.findUnique.mockResolvedValue({ id: 'm1' })
      prisma.review.findFirst.mockResolvedValue({ id: 'r1' })

      await expect(
        service.create({ merchant_id: 'm1', rating: 4 }, 'u1'),
      ).rejects.toThrow(ForbiddenException)
    })

    it('crée un avis en statut PENDING', async () => {
      prisma.merchant.findUnique.mockResolvedValue({ id: 'm1' })
      prisma.review.findFirst.mockResolvedValue(null)
      prisma.review.create.mockResolvedValue({
        id: 'r2',
        rating: 5,
        title: 'Super',
        content: 'Excellent café',
        status: 'PENDING',
        created_at: new Date(),
        user: { id: 'u1', full_name: 'Test', avatar: null },
      })

      const result = await service.create(
        { merchant_id: 'm1', rating: 5, title: 'Super', content: 'Excellent café' },
        'u1',
      )

      expect(prisma.review.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'PENDING', user_id: 'u1' }),
        }),
      )
      expect(result.status).toBe('PENDING')
    })
  })

  describe('findByMerchant', () => {
    it('ne retourne que les avis APPROVED', async () => {
      prisma.review.findMany.mockResolvedValue([])

      await service.findByMerchant('m1')

      expect(prisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { merchant_id: 'm1', status: 'APPROVED' },
        }),
      )
    })
  })
})

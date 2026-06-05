import { Test, TestingModule } from '@nestjs/testing'
import { AdminController } from './admin.controller'
import { PrismaService } from '../prisma/prisma.service'
import { ComplaintsService } from '../complaints/complaints.service'

describe('AdminController — modération', () => {
  let controller: AdminController
  let prisma: {
    review: { update: jest.Mock; delete: jest.Mock; findMany: jest.Mock }
    merchant: { count: jest.Mock; findMany: jest.Mock; update: jest.Mock }
    user: { count: jest.Mock; findMany: jest.Mock }
    complaint: { count: jest.Mock }
  }

  beforeEach(async () => {
    prisma = {
      review: {
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      merchant: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      user: { count: jest.fn().mockResolvedValue(0), findMany: jest.fn() },
      complaint: { count: jest.fn().mockResolvedValue(0) },
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        {
          provide: ComplaintsService,
          useValue: { findAll: jest.fn(), moderate: jest.fn() },
        },
      ],
    }).compile()

    controller = module.get(AdminController)
  })

  describe('moderateReview', () => {
    it('approuve un avis', async () => {
      prisma.review.update.mockResolvedValue({ id: 'r1', status: 'APPROVED' })

      const result = await controller.moderateReview('r1', { status: 'APPROVED' })

      expect(prisma.review.update).toHaveBeenCalledWith({
        where: { id: 'r1' },
        data: { status: 'APPROVED' },
        select: { id: true, status: true },
      })
      expect(result.status).toBe('APPROVED')
    })
  })

  describe('moderateReviewAction', () => {
    it('rejette un avis via action reject', async () => {
      prisma.review.update.mockResolvedValue({ id: 'r1', status: 'REJECTED' })

      const result = await controller.moderateReviewAction('r1', { action: 'reject' })

      expect(result).toEqual({ id: 'r1', status: 'REJECTED' })
    })

    it('supprime un avis via action delete', async () => {
      prisma.review.delete.mockResolvedValue({})

      const result = await controller.moderateReviewAction('r1', { action: 'delete' })

      expect(prisma.review.delete).toHaveBeenCalledWith({ where: { id: 'r1' } })
      expect(result).toEqual({ deleted: true })
    })
  })
})

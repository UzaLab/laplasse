import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      where: { is_active: true, parent_id: null },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        sort_order: true,
        children: {
          where: { is_active: true },
          select: { id: true, name: true, slug: true, icon: true, sort_order: true },
          orderBy: { sort_order: 'asc' },
        },
        _count: { select: { merchants: { where: { is_active: true } } } },
      },
      orderBy: { sort_order: 'asc' },
    })
  }

  async findBySlug(slug: string) {
    return this.prisma.category.findUnique({
      where: { slug, is_active: true },
      include: {
        children: { where: { is_active: true }, orderBy: { sort_order: 'asc' } },
        _count: { select: { merchants: { where: { is_active: true } } } },
      },
    })
  }
}

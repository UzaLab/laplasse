import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { slugify } from '../marketplace/marketplace.util'

export interface ProductCategoryNode {
  id: string
  name: string
  slug: string
  icon: string | null
  sort_order: number
  children: ProductCategoryNode[]
}

@Injectable()
export class ProductCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublicTree(country = 'CI'): Promise<ProductCategoryNode[]> {
    const code = country.toUpperCase().slice(0, 2)
    const rows = await this.prisma.productCategory.findMany({
      where: {
        is_active: true,
        OR: [
          { countries: { none: {} } },
          { countries: { some: { country_code: code } } },
        ],
      },
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        parent_id: true,
        sort_order: true,
      },
    })
    return this.buildTree(rows)
  }

  async listAdmin() {
    return this.prisma.productCategory.findMany({
      orderBy: [{ sort_order: 'asc' }, { name: 'asc' }],
      include: {
        countries: { select: { country_code: true } },
        _count: { select: { products: true } },
      },
    })
  }

  async create(data: {
    name: string
    slug?: string
    icon?: string
    parent_id?: string
    sort_order?: number
    country_codes?: string[]
  }) {
    const slug = data.slug?.trim() || slugify(data.name)
    const category = await this.prisma.productCategory.create({
      data: {
        name: data.name.trim(),
        slug,
        icon: data.icon ?? null,
        parent_id: data.parent_id ?? null,
        sort_order: data.sort_order ?? 0,
        countries: data.country_codes?.length
          ? {
              create: data.country_codes.map(code => ({
                country_code: code.toUpperCase().slice(0, 2),
              })),
            }
          : undefined,
      },
      include: { countries: true },
    })
    return category
  }

  async update(
    id: string,
    data: {
      name?: string
      slug?: string
      icon?: string | null
      parent_id?: string | null
      sort_order?: number
      is_active?: boolean
      country_codes?: string[]
    },
  ) {
    const existing = await this.prisma.productCategory.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException('Catégorie introuvable')

    if (data.country_codes !== undefined) {
      await this.prisma.productCategoryCountry.deleteMany({ where: { category_id: id } })
      if (data.country_codes.length) {
        await this.prisma.productCategoryCountry.createMany({
          data: data.country_codes.map(code => ({
            category_id: id,
            country_code: code.toUpperCase().slice(0, 2),
          })),
        })
      }
    }

    return this.prisma.productCategory.update({
      where: { id },
      data: {
        name: data.name?.trim(),
        slug: data.slug?.trim(),
        icon: data.icon,
        parent_id: data.parent_id,
        sort_order: data.sort_order,
        is_active: data.is_active,
      },
      include: { countries: true, _count: { select: { products: true } } },
    })
  }

  async resolveCategoryIdBySlug(slug?: string) {
    if (!slug?.trim()) return undefined
    const cat = await this.prisma.productCategory.findFirst({
      where: { slug: slug.trim(), is_active: true },
      select: { id: true },
    })
    return cat?.id
  }

  private buildTree(
    rows: {
      id: string
      name: string
      slug: string
      icon: string | null
      parent_id: string | null
      sort_order: number
    }[],
  ): ProductCategoryNode[] {
    const byParent = new Map<string | null, typeof rows>()
    for (const row of rows) {
      const key = row.parent_id
      if (!byParent.has(key)) byParent.set(key, [])
      byParent.get(key)!.push(row)
    }

    const visit = (parentId: string | null): ProductCategoryNode[] =>
      (byParent.get(parentId) ?? []).map(row => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        icon: row.icon,
        sort_order: row.sort_order,
        children: visit(row.id),
      }))

    return visit(null)
  }
}

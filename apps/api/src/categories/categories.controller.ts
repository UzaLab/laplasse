import { Controller, Get, Param, NotFoundException } from '@nestjs/common'
import { Public } from '../auth/decorators/public.decorator'
import { CategoriesService } from './categories.service'

@Public()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll() {
    return this.categoriesService.findAll()
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    const category = await this.categoriesService.findBySlug(slug)
    if (!category) throw new NotFoundException(`Category "${slug}" not found`)
    return category
  }
}

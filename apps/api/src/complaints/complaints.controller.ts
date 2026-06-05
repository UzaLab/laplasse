import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { ComplaintsService } from './complaints.service'

@Controller('complaints')
@UseGuards(JwtAuthGuard)
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post()
  create(
    @Body() body: { merchant_id: string; reason: string; description?: string },
    @CurrentUser() user: { id: string },
  ) {
    return this.complaintsService.create(body, user.id)
  }
}

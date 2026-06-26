import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { OrganizationsService } from './organizations.service'
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto'

@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOrganizationDto,
  ) {
    return this.organizationsService.create(userId, dto)
  }

  @Get('mine')
  findMine(@CurrentUser('id') userId: string) {
    return this.organizationsService.findMine(userId)
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') orgId: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(userId, orgId, dto)
  }

  @Post(':id/merchants/:merchantId')
  attachMerchant(
    @CurrentUser('id') userId: string,
    @Param('id') orgId: string,
    @Param('merchantId') merchantId: string,
  ) {
    return this.organizationsService.attachMerchant(userId, orgId, merchantId)
  }

  @Delete(':id/merchants/:merchantId')
  detachMerchant(
    @CurrentUser('id') userId: string,
    @Param('id') orgId: string,
    @Param('merchantId') merchantId: string,
  ) {
    return this.organizationsService.detachMerchant(userId, orgId, merchantId)
  }

  @Get(':id/analytics')
  getAnalytics(
    @CurrentUser('id') userId: string,
    @Param('id') orgId: string,
  ) {
    return this.organizationsService.getAnalytics(userId, orgId)
  }

  @Get(':id/analytics/chart')
  getAnalyticsChart(
    @CurrentUser('id') userId: string,
    @Param('id') orgId: string,
    @Query('days') days?: string,
    @Query('event') event?: string,
  ) {
    return this.organizationsService.getAnalyticsChart(
      userId,
      orgId,
      days ? Number(days) : 30,
      event ?? 'VIEW',
    )
  }
}

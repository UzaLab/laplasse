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
import { LogisticsPartnersService } from './logistics-partners.service'
import { LogisticsPartnerOpsService } from './logistics-partner-ops.service'
import {
  LinkPartnerCourierDto,
  RegisterLogisticsPartnerDto,
} from '../delivery/dto/delivery-stakeholders.dto'

@Controller('logistics')
@UseGuards(JwtAuthGuard)
export class LogisticsController {
  constructor(
    private readonly partners: LogisticsPartnersService,
    private readonly ops: LogisticsPartnerOpsService,
  ) {}

  @Post('register')
  register(@CurrentUser('id') userId: string, @Body() dto: RegisterLogisticsPartnerDto) {
    return this.partners.register(userId, dto)
  }

  @Get('partners/:id/score')
  getPartnerScore(@Param('id') id: string) {
    return this.partners.getPublicScore(id)
  }

  @Get('me')
  getMe(@CurrentUser('id') userId: string) {
    return this.partners.getMyPartner(userId)
  }

  @Get('partners')
  listPublic(@Query('country') country?: string, @Query('city') city?: string) {
    return this.partners.listPublic(country, city)
  }

  @Get('me/fleet')
  listFleet(@CurrentUser('id') userId: string) {
    return this.ops.listFleetWithStats(userId)
  }

  @Get('me/fleet/:courierId')
  getFleetCourier(
    @CurrentUser('id') userId: string,
    @Param('courierId') courierId: string,
  ) {
    return this.ops.getFleetCourierDetail(userId, courierId)
  }

  @Delete('me/fleet/:courierId')
  unlinkFleet(
    @CurrentUser('id') userId: string,
    @Param('courierId') courierId: string,
  ) {
    return this.ops.unlinkFleetCourier(userId, courierId)
  }

  @Post('me/fleet/link')
  linkFleet(@CurrentUser('id') userId: string, @Body() dto: LinkPartnerCourierDto) {
    return this.partners.linkFleetCourier(userId, dto.email)
  }

  @Get('me/jobs')
  listJobs(@CurrentUser('id') userId: string) {
    return this.partners.listActiveJobs(userId)
  }

  @Get('me/jobs/list')
  listAllJobs(
    @CurrentUser('id') userId: string,
    @Query('status') status?: string,
    @Query('days') days?: string,
    @Query('take') take?: string,
  ) {
    const d = days ? Number.parseInt(days, 10) : undefined
    const t = take ? Number.parseInt(take, 10) : undefined
    return this.ops.listJobs(userId, {
      status,
      days: Number.isFinite(d) ? d : undefined,
      take: Number.isFinite(t) ? t : undefined,
    })
  }

  @Get('me/jobs/:jobId')
  getJob(
    @CurrentUser('id') userId: string,
    @Param('jobId') jobId: string,
  ) {
    return this.ops.getJob(userId, jobId)
  }

  @Get('me/stats')
  getStats(@CurrentUser('id') userId: string) {
    return this.ops.getPartnerStats(userId)
  }

  @Patch('me/jobs/:jobId/assign')
  assignJob(
    @CurrentUser('id') userId: string,
    @Param('jobId') jobId: string,
    @Body() body: { courier_profile_id: string },
  ) {
    return this.partners.assignJob(userId, jobId, body.courier_profile_id)
  }

  @Get('me/contracts')
  listMyContracts(@CurrentUser('id') userId: string) {
    return this.partners.listPartnerContracts(userId)
  }

  @Patch('me/contracts/:id')
  respondContract(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: { accept: boolean },
  ) {
    return this.partners.respondContract(userId, id, body.accept)
  }
}

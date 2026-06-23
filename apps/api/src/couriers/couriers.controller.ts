import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { SkipThrottle } from '@nestjs/throttler'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { CouriersService } from './couriers.service'
import { CourierJobsService } from './courier-jobs.service'
import { CourierWalletService } from './courier-wallet.service'
import { RegisterCourierDto } from './dto/register-courier.dto'
import { UpsertCourierZoneDto } from './dto/upsert-courier-zone.dto'
import { UpdateCourierLocationDto } from './dto/update-courier-location.dto'
import { UpdateCourierJobStatusDto } from './dto/update-courier-job-status.dto'

@Controller('couriers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CouriersController {
  constructor(
    private readonly couriersService: CouriersService,
    private readonly courierJobs: CourierJobsService,
    private readonly courierWallet: CourierWalletService,
  ) {}

  @Get('me')
  @Roles('USER', 'MERCHANT', 'COURIER', 'ADMIN', 'SUPER_ADMIN')
  getMe(@CurrentUser() user: { id: string }) {
    return this.couriersService.getMyProfile(user.id)
  }

  @Post('register')
  @Roles('USER', 'MERCHANT', 'COURIER')
  register(
    @CurrentUser() user: { id: string },
    @Body() dto: RegisterCourierDto,
  ) {
    return this.couriersService.register(user.id, dto)
  }

  @Patch('me/online')
  @Roles('COURIER', 'MERCHANT')
  setOnline(
    @CurrentUser() user: { id: string },
    @Body() body: { is_online: boolean },
  ) {
    return this.couriersService.setOnline(user.id, !!body.is_online)
  }

  @Post('me/location')
  @SkipThrottle()
  @Roles('COURIER', 'MERCHANT')
  updateLocation(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateCourierLocationDto,
  ) {
    return this.couriersService.updateLocation(user.id, dto)
  }

  @Get('me/zones')
  @Roles('COURIER', 'MERCHANT')
  listZones(@CurrentUser() user: { id: string }) {
    return this.couriersService.listServiceZones(user.id)
  }

  @Put('me/zones')
  @Roles('COURIER', 'MERCHANT')
  upsertZone(
    @CurrentUser() user: { id: string },
    @Body() dto: UpsertCourierZoneDto,
  ) {
    return this.couriersService.upsertServiceZone(user.id, dto)
  }

  @Delete('me/zones/:zoneId')
  @Roles('COURIER', 'MERCHANT')
  deleteZone(
    @CurrentUser() user: { id: string },
    @Param('zoneId') zoneId: string,
  ) {
    return this.couriersService.deleteServiceZone(user.id, zoneId)
  }

  // ── Missions (DN-1) ────────────────────────────────────────────────────────

  @Get('me/jobs/available')
  @Roles('COURIER', 'MERCHANT')
  listAvailableJobs(@CurrentUser() user: { id: string }) {
    return this.courierJobs.listAvailable(user.id)
  }

  @Get('me/jobs/active')
  @Roles('COURIER', 'MERCHANT')
  getActiveJob(@CurrentUser() user: { id: string }) {
    return this.courierJobs.getActive(user.id)
  }

  @Get('me/jobs/history')
  @Roles('COURIER', 'MERCHANT')
  listJobHistory(@CurrentUser() user: { id: string }) {
    return this.courierJobs.listHistory(user.id)
  }

  @Post('me/jobs/:jobId/accept')
  @Roles('COURIER', 'MERCHANT')
  acceptJob(
    @CurrentUser() user: { id: string },
    @Param('jobId') jobId: string,
  ) {
    return this.courierJobs.accept(user.id, jobId)
  }

  @Post('me/jobs/:jobId/reject')
  @Roles('COURIER', 'MERCHANT')
  rejectJob(
    @CurrentUser() user: { id: string },
    @Param('jobId') jobId: string,
  ) {
    return this.courierJobs.reject(user.id, jobId)
  }

  @Patch('me/jobs/:jobId/status')
  @Roles('COURIER', 'MERCHANT')
  updateJobStatus(
    @CurrentUser() user: { id: string },
    @Param('jobId') jobId: string,
    @Body() dto: UpdateCourierJobStatusDto,
  ) {
    return this.courierJobs.advanceStatus(user.id, jobId, dto.status, dto.proof_otp)
  }

  @Post('me/jobs/:jobId/proof-photo')
  @Roles('COURIER', 'MERCHANT')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  uploadProofPhoto(
    @CurrentUser() user: { id: string },
    @Param('jobId') jobId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.courierJobs.uploadProofPhoto(user.id, jobId, file)
  }

  // ── Gains (DN-1.4) ───────────────────────────────────────────────────────

  @Get('me/wallet')
  @Roles('COURIER', 'MERCHANT')
  getWallet(@CurrentUser() user: { id: string }) {
    return this.courierWallet.getSummary(user.id)
  }

  @Get('me/wallet/entries')
  @Roles('COURIER', 'MERCHANT')
  listWalletEntries(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? Number.parseInt(page, 10) : 1
    const l = limit ? Number.parseInt(limit, 10) : 20
    return this.courierWallet.listEntries(
      user.id,
      Number.isFinite(p) ? p : 1,
      Number.isFinite(l) ? l : 20,
    )
  }
}

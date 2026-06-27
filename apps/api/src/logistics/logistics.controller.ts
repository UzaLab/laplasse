import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { LogisticsPartnersService } from './logistics-partners.service'
import { LogisticsPartnerOpsService } from './logistics-partner-ops.service'
import { DeliveryZonesService, type CreateDeliveryZoneDto } from '../delivery-zones/delivery-zones.service'
import {
  LinkPartnerCourierDto,
  RegisterLogisticsPartnerDto,
} from '../delivery/dto/delivery-stakeholders.dto'
import { UpdateLogisticsSettingsDto } from './dto/logistics-settings.dto'
import { SaveLogisticsOnboardingDto } from './dto/logistics-onboarding.dto'
import {
  RespondPartnerContractDto,
  UpdatePartnerContractDto,
} from './dto/partner-contract.dto'

@Controller('logistics')
@UseGuards(JwtAuthGuard)
export class LogisticsController {
  constructor(
    private readonly partners: LogisticsPartnersService,
    private readonly ops: LogisticsPartnerOpsService,
    private readonly deliveryZones: DeliveryZonesService,
  ) {}

  @Post('register')
  register(@CurrentUser('id') userId: string, @Body() dto: RegisterLogisticsPartnerDto) {
    return this.partners.register(userId, dto)
  }

  @Patch('me/onboarding')
  saveOnboarding(@CurrentUser('id') userId: string, @Body() body: SaveLogisticsOnboardingDto) {
    return this.partners.saveOnboarding(userId, body)
  }

  @Get('me/fleet/invite-link')
  getFleetInviteLink(@CurrentUser('id') userId: string) {
    return this.partners.getFleetInviteLink(userId)
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

  @Get('me/settings')
  getSettings(@CurrentUser('id') userId: string) {
    return this.partners.getPartnerSettings(userId)
  }

  @Patch('me/settings')
  updateSettingsProfile(
    @CurrentUser('id') userId: string,
    @Body() body: UpdateLogisticsSettingsDto,
  ) {
    return this.partners.updatePartnerSettings(userId, body)
  }

  @Post('me/logo')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
  }))
  uploadLogo(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.partners.uploadLogo(userId, file)
  }

  @Post('me/kyc-document')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
  }))
  uploadKycDocument(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.partners.uploadKycDocument(userId, file)
  }

  @Get('me/dispatch-board')
  getDispatchBoard(
    @CurrentUser('id') userId: string,
    @Query('commune_id') communeId?: string,
  ) {
    return this.ops.getDispatchBoard(userId, communeId)
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

  @Patch('me/fleet/:courierId/status')
  updateFleetCourierStatus(
    @CurrentUser('id') userId: string,
    @Param('courierId') courierId: string,
    @Body() body: { status: 'ACTIVE' | 'SUSPENDED' },
  ) {
    return this.ops.updateFleetCourierStatus(userId, courierId, body.status)
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

  @Get('me/jobs/:jobId/suggest-courier')
  suggestCourier(
    @CurrentUser('id') userId: string,
    @Param('jobId') jobId: string,
  ) {
    return this.ops.suggestCourierForJob(userId, jobId)
  }

  @Patch('me/jobs/:jobId/release')
  releaseJob(
    @CurrentUser('id') userId: string,
    @Param('jobId') jobId: string,
  ) {
    return this.ops.releasePartnerJob(userId, jobId)
  }

  @Get('me/stats')
  getStats(@CurrentUser('id') userId: string) {
    return this.ops.getPartnerStats(userId)
  }

  @Get('me/quality')
  getQuality(@CurrentUser('id') userId: string) {
    return this.ops.getPartnerQuality(userId)
  }

  @Get('me/finances')
  getFinances(
    @CurrentUser('id') userId: string,
    @Query('month') month?: string,
  ) {
    return this.ops.getFinances(userId, month)
  }

  @Get('me/finances/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="finances.csv"')
  async exportFinances(
    @CurrentUser('id') userId: string,
    @Query('month') month?: string,
  ) {
    return this.ops.exportFinancesCsv(userId, month)
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

  @Get('me/contracts/:id')
  getMyContract(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.partners.getPartnerContract(userId, id)
  }

  @Patch('me/contracts/:id')
  patchContract(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: RespondPartnerContractDto & UpdatePartnerContractDto,
  ) {
    if (body.accept !== undefined) {
      return this.partners.respondContract(userId, id, body.accept)
    }
    return this.partners.updatePartnerContract(userId, id, {
      sla_eta_max_minutes: body.sla_eta_max_minutes,
      fee_override: body.fee_override,
      auto_dispatch: body.auto_dispatch,
      pause: body.pause,
    })
  }

  @Get('me/prospects')
  listProspects(@CurrentUser('id') userId: string) {
    return this.partners.listPartnerProspects(userId)
  }

  @Post('me/prospects/:shopId/propose')
  proposePartnership(
    @CurrentUser('id') userId: string,
    @Param('shopId') shopId: string,
  ) {
    return this.partners.proposePartnership(userId, shopId)
  }

  // ── Zones de livraison du prestataire logistique ────────────────────────────

  @Get('me/delivery-zones')
  async listMyDeliveryZones(@CurrentUser('id') userId: string) {
    const partner = await this.partners.resolveMyPartner(userId)
    return this.deliveryZones.listForLogisticsPartner(partner.id)
  }

  @Post('me/delivery-zones')
  async createMyDeliveryZone(@CurrentUser('id') userId: string, @Body() dto: CreateDeliveryZoneDto) {
    const partner = await this.partners.resolveMyPartner(userId)
    return this.deliveryZones.createForLogisticsPartner(partner.id, dto)
  }

  @Delete('me/delivery-zones/:zoneId')
  async deleteMyDeliveryZone(@CurrentUser('id') userId: string, @Param('zoneId') zoneId: string) {
    const partner = await this.partners.resolveMyPartner(userId)
    return this.deliveryZones.deleteZoneForPartner(partner.id, zoneId)
  }
}

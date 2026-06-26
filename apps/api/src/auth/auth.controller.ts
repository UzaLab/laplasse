import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import { Throttle } from '@nestjs/throttler'
import { ConfigService } from '@nestjs/config'
import { AuthService } from './auth.service'
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  SendOtpDto,
  VerifyOtpDto,
  UpdateMeDto,
  ChangePasswordDto,
} from './dto/auth.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { Public } from './decorators/public.decorator'
import { CurrentUser } from './decorators/current-user.decorator'
import {
  clearAuthCookies,
  getRefreshTokenFromRequest,
  setAuthCookies,
} from './auth-cookies'

@Controller('auth')
@Throttle({ default: { limit: 10, ttl: 60_000 } })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, access_token, refresh_token } = await this.authService.register(dto)
    setAuthCookies(res, this.config, access_token, refresh_token)
    return { user }
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, access_token, refresh_token } = await this.authService.login(dto)
    setAuthCookies(res, this.config, access_token, refresh_token)
    return { user }
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('otp/send')
  @HttpCode(HttpStatus.OK)
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendPhoneOtp(dto.phone)
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, access_token, refresh_token } = await this.authService.loginWithPhoneOtp(
      dto.phone,
      dto.code,
    )
    setAuthCookies(res, this.config, access_token, refresh_token)
    return { user }
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('guest/otp/send')
  @HttpCode(HttpStatus.OK)
  sendGuestOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendGuestOtp(dto.phone)
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('guest/otp/verify')
  @HttpCode(HttpStatus.OK)
  async verifyGuestOtp(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, access_token, refresh_token } = await this.authService.guestCheckoutWithPhoneOtp(
      dto.phone,
      dto.code,
    )
    setAuthCookies(res, this.config, access_token, refresh_token)
    return { user }
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Body() dto: RefreshTokenDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = getRefreshTokenFromRequest(req) ?? dto.refresh_token
    if (!refreshToken) {
      clearAuthCookies(res, this.config)
      throw new UnauthorizedException('Session expirée, reconnectez-vous')
    }

    const { access_token, refresh_token } = await this.authService.refreshFromToken(refreshToken)
    setAuthCookies(res, this.config, access_token, refresh_token)
    return { success: true }
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@CurrentUser() user: { id: string }) {
    return this.authService.getMe(user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  updateMe(@CurrentUser() user: { id: string }, @Body() dto: UpdateMeDto) {
    return this.authService.updateMe(user.id, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/password')
  @HttpCode(HttpStatus.OK)
  changePassword(@CurrentUser() user: { id: string }, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(user.id, dto)
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @CurrentUser() user: { id: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = getRefreshTokenFromRequest(req)
    const result = await this.authService.logout(refreshToken)
    clearAuthCookies(res, this.config)
    return result
  }
}

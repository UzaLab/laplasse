import {
  Injectable, ConflictException, UnauthorizedException, BadRequestException, Logger,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { hash, compare } from 'bcryptjs'
import { PrismaService } from '../prisma/prisma.service'
import { OtpService } from '../otp/otp.service'
import { NotificationsService } from '../notifications/notifications.service'
import { LoyaltyService } from '../loyalty/loyalty.service'
import { RegisterDto, LoginDto } from './dto/auth.dto'
import {
  createRefreshTokenValue,
  hashToken,
  refreshExpiresAt,
} from './auth-token.util'

export interface AuthSessionResult {
  user: Record<string, unknown>
  access_token: string
  refresh_token: string
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly otp: OtpService,
    private readonly notifications: NotificationsService,
    private readonly loyalty: LoyaltyService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthSessionResult> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (existing) throw new ConflictException('Cet email est déjà utilisé')

    const phone = dto.phone?.trim() || null

    if (phone) {
      const phoneTaken = await this.prisma.user.findUnique({ where: { phone } })
      if (phoneTaken) throw new ConflictException('Ce numéro de téléphone est déjà utilisé')
    }

    const passwordHash = await hash(dto.password, 12)

    let user
    try {
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          password_hash: passwordHash,
          full_name: dto.full_name,
          phone,
          role: 'USER',
        },
        select: { id: true, email: true, full_name: true, role: true, created_at: true },
      })
    } catch (err: unknown) {
      if (this.isUniqueConstraint(err, 'phone')) {
        throw new ConflictException('Ce numéro de téléphone est déjà utilisé')
      }
      if (this.isUniqueConstraint(err, 'email')) {
        throw new ConflictException('Cet email est déjà utilisé')
      }
      throw err
    }

    const tokens = await this.issueTokenPair(user.id, user.email, user.role)
    this.logger.log(`New user registered: ${user.email}`)

    Promise.all([
      this.loyalty.getOrCreateAccount(user.id),
      this.notifications.sendWelcome(user.id, user.full_name ?? undefined),
    ]).catch(() => {})

    return { user, ...tokens }
  }

  async login(dto: LoginDto): Promise<AuthSessionResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email, is_active: true },
      select: {
        id: true, email: true, full_name: true, avatar: true,
        role: true, password_hash: true, created_at: true,
        merchants: {
          select: {
            id: true, business_name: true, slug: true,
            verification_status: true, subscription_plan: true, organization_id: true,
          },
        },
        shops: {
          select: {
            id: true, name: true, slug: true, status: true, merchant_id: true,
          },
        },
        organization: {
          select: { id: true, name: true, type: true, logo: true },
        },
      },
    })

    if (!user || !user.password_hash) throw new UnauthorizedException('Invalid credentials')

    const valid = await compare(dto.password, user.password_hash)
    if (!valid) throw new UnauthorizedException('Invalid credentials')

    const { password_hash: _, ...safeUser } = user
    const tokens = await this.issueTokenPair(user.id, user.email, user.role)

    return { user: safeUser, ...tokens }
  }

  async refresh(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, is_active: true },
      select: { id: true, email: true, role: true },
    })
    if (!user) throw new UnauthorizedException()

    return this.issueTokenPair(user.id, user.email, user.role)
  }

  async refreshFromToken(refreshToken: string) {
    const stored = await this.findValidRefreshToken(refreshToken)
    if (!stored) {
      throw new UnauthorizedException('Session expirée, reconnectez-vous')
    }

    await this.prisma.authToken.delete({ where: { id: stored.id } })
    return this.refresh(stored.user_id)
  }

  async getMe(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, full_name: true, avatar: true,
        phone: true, role: true, created_at: true,
        merchants: {
          select: {
            id: true, business_name: true, slug: true,
            verification_status: true, subscription_plan: true, organization_id: true,
          },
        },
        shops: {
          select: {
            id: true, name: true, slug: true, status: true, merchant_id: true,
          },
        },
        organization: {
          select: { id: true, name: true, type: true, logo: true },
        },
      },
    })
  }

  async sendPhoneOtp(phone: string) {
    return this.otp.send(phone, 'login')
  }

  async loginWithPhoneOtp(phone: string, code: string): Promise<AuthSessionResult> {
    const valid = await this.otp.verify(phone, 'login', code)
    if (!valid) throw new BadRequestException('Code OTP invalide ou expiré')

    const normalized = this.otp.normalizePhone(phone)
    const user = await this.prisma.user.findFirst({
      where: {
        is_active: true,
        OR: [
          { phone: { contains: normalized.slice(-8) } },
          { phone: phone },
        ],
      },
      select: {
        id: true, email: true, full_name: true, avatar: true,
        phone: true, role: true, is_verified: true, created_at: true,
      },
    })

    if (!user) throw new BadRequestException('Aucun compte associé à ce numéro')

    await this.prisma.user.update({
      where: { id: user.id },
      data: { is_verified: true },
    })

    const tokens = await this.issueTokenPair(user.id, user.email, user.role)
    return { user: { ...user, is_verified: true }, ...tokens }
  }

  async sendGuestOtp(phone: string) {
    return this.otp.send(phone, 'guest')
  }

  async guestCheckoutWithPhoneOtp(phone: string, code: string): Promise<AuthSessionResult> {
    const valid = await this.otp.verify(phone, 'guest', code)
    if (!valid) throw new BadRequestException('Code OTP invalide ou expiré')

    const normalized = this.otp.normalizePhone(phone)
    const phoneVariants = [`+225${normalized.slice(-10)}`, `+226${normalized.slice(-8)}`, `+221${normalized.slice(-9)}`, phone]

    let user = await this.prisma.user.findFirst({
      where: {
        is_active: true,
        OR: phoneVariants.flatMap(p => [
          { phone: p },
          { phone: { contains: normalized.slice(-8) } },
        ]),
      },
      select: {
        id: true, email: true, full_name: true, avatar: true,
        phone: true, role: true, is_verified: true, created_at: true,
      },
    })

    if (!user) {
      const guestEmail = `guest.${normalized}.${Date.now()}@guest.laplasse.local`
      user = await this.prisma.user.create({
        data: {
          email: guestEmail,
          phone: phone.startsWith('+') ? phone : `+225${normalized.slice(-10)}`,
          full_name: 'Client invité',
          role: 'USER',
          is_verified: true,
          is_active: true,
          country: 'CI',
        },
        select: {
          id: true, email: true, full_name: true, avatar: true,
          phone: true, role: true, is_verified: true, created_at: true,
        },
      })
    } else {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { is_verified: true },
      })
    }

    const tokens = await this.issueTokenPair(user.id, user.email, user.role)
    return { user: { ...user, is_verified: true }, ...tokens }
  }

  async logout(refreshToken: string | null) {
    if (refreshToken) {
      await this.prisma.authToken.deleteMany({
        where: { token: hashToken(refreshToken), type: 'refresh' },
      })
    }
    return { success: true, message: 'Logged out' }
  }

  async revokeAllSessions(userId: string) {
    await this.prisma.authToken.deleteMany({
      where: { user_id: userId, type: 'refresh' },
    })
  }

  private async findValidRefreshToken(refreshToken: string) {
    return this.prisma.authToken.findFirst({
      where: {
        token: hashToken(refreshToken),
        type: 'refresh',
        expires_at: { gt: new Date() },
      },
    })
  }

  private async issueTokenPair(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role }
    const refresh_token = createRefreshTokenValue()

    const access_token = await this.jwt.signAsync(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRES') ?? '15m',
    })

    await this.prisma.authToken.create({
      data: {
        user_id: userId,
        token: hashToken(refresh_token),
        type: 'refresh',
        expires_at: refreshExpiresAt(this.config),
      },
    })

    return { access_token, refresh_token }
  }

  private isUniqueConstraint(err: unknown, field: string): boolean {
    return (
      typeof err === 'object' && err !== null
      && 'code' in err && (err as { code: string }).code === 'P2002'
      && 'meta' in err
      && Array.isArray((err as { meta: { target?: string[] } }).meta?.target)
      && (err as { meta: { target: string[] } }).meta.target.includes(field)
    )
  }
}

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
import { BookingsService } from '../bookings/bookings.service'
import { ShopsService } from '../shops/shops.service'
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

  private readonly logisticsPartnerSelect = {
    id: true,
    legal_name: true,
    trade_name: true,
    slug: true,
    city: true,
    country: true,
    phone: true,
    verification: true,
    is_active: true,
    onboarding_step: true,
    logo: true,
    _count: { select: { couriers: true, contracts: true } },
  } as const

  private readonly authUserSelect = {
    id: true,
    email: true,
    full_name: true,
    avatar: true,
    phone: true,
    role: true,
    created_at: true,
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
    courier_profile: {
      select: {
        id: true, status: true, city: true, country: true,
        vehicle: true, is_online: true, rating_avg: true, rating_count: true,
        current_latitude: true, current_longitude: true, last_location_at: true,
        phone: true, plate_number: true, completed_jobs: true,
      },
    },
    logistics_partner: { select: this.logisticsPartnerSelect },
    logistics_partner_staff: {
      select: {
        role: true,
        partner: { select: this.logisticsPartnerSelect },
      },
    },
  } as const

  private mapAuthUser<T extends {
    logistics_partner?: unknown
    logistics_partner_staff?: { partner: unknown } | null
  }>(user: T) {
    const { logistics_partner_staff, logistics_partner, ...rest } = user
    const partner = logistics_partner
      ?? logistics_partner_staff?.partner
      ?? null
    return { ...rest, logistics_partner: partner }
  }

  private async withAccessibleShops<
    T extends {
      id: string
      shops?: unknown
      logistics_partner?: unknown
      logistics_partner_staff?: { partner: unknown } | null
    },
  >(user: T) {
    const shops = await this.shops.listAccessibleMini(user.id)
    return this.mapAuthUser({ ...user, shops })
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly otp: OtpService,
    private readonly notifications: NotificationsService,
    private readonly loyalty: LoyaltyService,
    private readonly bookings: BookingsService,
    private readonly shops: ShopsService,
  ) {}

  private afterAuthLinkBookings(userId: string, phone?: string | null) {
    void this.bookings.linkGuestBookingsByPhone(userId, phone).catch(err => {
      this.logger.warn(`Rattachement réservations invité échoué: ${(err as Error).message}`)
    })
  }

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

    this.afterAuthLinkBookings(user.id, phone)

    return { user, ...tokens }
  }

  async login(dto: LoginDto): Promise<AuthSessionResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email, is_active: true },
      select: { ...this.authUserSelect, password_hash: true },
    })

    if (!user?.password_hash) throw new UnauthorizedException('Invalid credentials')

    const valid = await compare(dto.password, user.password_hash)
    if (!valid) throw new UnauthorizedException('Invalid credentials')

    const { password_hash: _, logistics_partner_staff: __, ...safeUser } = user
    const tokens = await this.issueTokenPair(user.id, user.email, user.role)

    this.afterAuthLinkBookings(user.id, user.phone)

    return { user: await this.withAccessibleShops(safeUser), ...tokens }
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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: this.authUserSelect,
    })
    if (!user) return null
    return this.withAccessibleShops(user)
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
    this.afterAuthLinkBookings(user.id, user.phone ?? phone)
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
    this.afterAuthLinkBookings(user.id, user.phone ?? phone)
    return { user: { ...user, is_verified: true }, ...tokens }
  }

  async resolveGuestForCheckout(input: {
    first_name: string
    last_name: string
    phone: string
    create_account?: boolean
    email?: string
    password?: string
  }): Promise<AuthSessionResult> {
    const full_name = `${input.first_name.trim()} ${input.last_name.trim()}`.trim()
    if (!full_name) {
      throw new BadRequestException('Nom et prénom requis')
    }

    const phone = input.phone.trim()
    if (!phone) {
      throw new BadRequestException('Numéro de téléphone requis')
    }

    if (input.create_account) {
      const email = input.email?.trim().toLowerCase()
      const password = input.password
      if (!email || !password) {
        throw new BadRequestException('Email et mot de passe requis pour créer un compte')
      }

      const existingEmail = await this.prisma.user.findUnique({ where: { email } })
      if (existingEmail) {
        throw new ConflictException('Cet email est déjà utilisé — connectez-vous')
      }

      const phoneTaken = await this.prisma.user.findFirst({
        where: { phone, is_active: true },
      })
      if (phoneTaken) {
        throw new ConflictException('Ce numéro de téléphone est déjà utilisé')
      }

      const passwordHash = await hash(password, 12)
      const user = await this.prisma.user.create({
        data: {
          email,
          password_hash: passwordHash,
          full_name,
          phone,
          role: 'USER',
          is_verified: true,
          is_active: true,
          country: 'CI',
        },
        select: this.authUserSelect,
      })

      const tokens = await this.issueTokenPair(user.id, user.email, user.role)
      this.afterAuthLinkBookings(user.id, user.phone)
      return { user: await this.withAccessibleShops(user), ...tokens }
    }

    const normalized = this.otp.normalizePhone(phone)
    const phoneVariants = [
      phone,
      `+225${normalized.slice(-10)}`,
      `+226${normalized.slice(-8)}`,
      `+221${normalized.slice(-9)}`,
    ]

    let user = await this.prisma.user.findFirst({
      where: {
        is_active: true,
        OR: phoneVariants.flatMap(p => [
          { phone: p },
          { phone: { contains: normalized.slice(-8) } },
        ]),
      },
      select: this.authUserSelect,
    })

    if (!user) {
      const guestEmail = `guest.${normalized}.${Date.now()}@guest.laplasse.local`
      user = await this.prisma.user.create({
        data: {
          email: guestEmail,
          phone: phone.startsWith('+') ? phone : `+225${normalized.slice(-10)}`,
          full_name,
          role: 'USER',
          is_verified: false,
          is_active: true,
          country: 'CI',
        },
        select: this.authUserSelect,
      })
    } else {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { full_name, phone: user.phone ?? phone },
        select: this.authUserSelect,
      })
    }

    const tokens = await this.issueTokenPair(user.id, user.email, user.role)
    this.afterAuthLinkBookings(user.id, user.phone ?? phone)
    return { user: await this.withAccessibleShops(user), ...tokens }
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

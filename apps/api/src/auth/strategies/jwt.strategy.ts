import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import type { Request } from 'express'
import { PrismaService } from '../../prisma/prisma.service'
import { ACCESS_COOKIE } from '../auth-cookies'

export interface JwtPayload {
  sub: string
  email: string
  role: string
}

function extractJwtFromCookieOrHeader(req: Request): string | null {
  const cookieToken = req.cookies?.[ACCESS_COOKIE]
  if (typeof cookieToken === 'string' && cookieToken.length > 0) {
    return cookieToken
  }
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req)
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: extractJwtFromCookieOrHeader,
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET') ?? 'laplasse-dev-secret',
    })
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub, is_active: true },
      select: { id: true, email: true, role: true, full_name: true },
    })
    if (!user) throw new UnauthorizedException()
    return user
  }
}

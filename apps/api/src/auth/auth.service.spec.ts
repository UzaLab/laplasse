import { ConflictException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { AuthService } from './auth.service'
import { PrismaService } from '../prisma/prisma.service'
import { OtpService } from '../otp/otp.service'

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
}))

import { hash, compare } from 'bcryptjs'

describe('AuthService', () => {
  let service: AuthService
  let prisma: {
    user: {
      findUnique: jest.Mock
      findFirst: jest.Mock
      create: jest.Mock
      update: jest.Mock
    }
    authToken: {
      create: jest.Mock
      findFirst: jest.Mock
      delete: jest.Mock
      deleteMany: jest.Mock
    }
  }
  let jwt: { signAsync: jest.Mock }
  let config: { get: jest.Mock }
  let otp: { send: jest.Mock; verify: jest.Mock; normalizePhone: jest.Mock }

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      authToken: {
        create: jest.fn().mockResolvedValue({ id: 't1' }),
        findFirst: jest.fn(),
        delete: jest.fn(),
        deleteMany: jest.fn(),
      },
    }
    jwt = { signAsync: jest.fn().mockResolvedValue('access-jwt') }
    config = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'test-secret'
        if (key === 'JWT_ACCESS_EXPIRES') return '15m'
        if (key === 'JWT_REFRESH_EXPIRES') return '30d'
        return undefined
      }),
    }
    otp = {
      send: jest.fn().mockResolvedValue({ sent: true }),
      verify: jest.fn(),
      normalizePhone: jest.fn().mockReturnValue('+22507000001'),
    }

    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt as unknown as JwtService,
      config as unknown as ConfigService,
      otp as unknown as OtpService,
      { sendWelcome: jest.fn() } as never,
      { getOrCreateAccount: jest.fn() } as never,
      { linkGuestBookingsByPhone: jest.fn().mockResolvedValue({ linked: 0 }) } as never,
    )
    jest.clearAllMocks()
  })

  describe('register', () => {
    it('rejette un email déjà utilisé', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' })

      await expect(
        service.register({
          email: 'taken@laplasse.ci',
          password: 'Password1!',
          full_name: 'Test User',
        }),
      ).rejects.toThrow(ConflictException)
    })

    it('crée un utilisateur et retourne des tokens', async () => {
      prisma.user.findUnique.mockResolvedValue(null)
      prisma.user.create.mockResolvedValue({
        id: 'u2',
        email: 'new@laplasse.ci',
        full_name: 'New User',
        role: 'USER',
        created_at: new Date(),
      })

      const result = await service.register({
        email: 'new@laplasse.ci',
        password: 'Password1!',
        full_name: 'New User',
      })

      expect(hash).toHaveBeenCalledWith('Password1!', 12)
      expect(prisma.authToken.create).toHaveBeenCalled()
      expect(result.user.email).toBe('new@laplasse.ci')
      expect(result.access_token).toBe('access-jwt')
      expect(result.refresh_token).toEqual(expect.any(String))
    })
  })

  describe('login', () => {
    it('rejette des identifiants invalides', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(
        service.login({ email: 'x@laplasse.ci', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException)
    })

    it('connecte un utilisateur avec un mot de passe valide', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'admin@laplasse.ci',
        full_name: 'Admin',
        avatar: null,
        role: 'ADMIN',
        password_hash: 'hashed',
        created_at: new Date(),
      })
      ;(compare as jest.Mock).mockResolvedValue(true)

      const result = await service.login({
        email: 'admin@laplasse.ci',
        password: 'Admin2026!',
      })

      expect(result.user.email).toBe('admin@laplasse.ci')
      expect(result.user).not.toHaveProperty('password_hash')
      expect(result.access_token).toBe('access-jwt')
      expect(prisma.authToken.create).toHaveBeenCalled()
    })
  })
})

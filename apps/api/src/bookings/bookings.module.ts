import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { PrismaModule } from '../prisma/prisma.module'
import { FraudModule } from '../fraud/fraud.module'
import { BookingsService } from './bookings.service'
import { BookingsController } from './bookings.controller'
import { AvailabilityService } from './availability.service'

@Module({
  imports: [
    PrismaModule,
    FraudModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET') ?? 'laplasse-dev-secret',
      }),
    }),
  ],
  controllers: [BookingsController],
  providers: [BookingsService, AvailabilityService],
  exports: [BookingsService, AvailabilityService],
})
export class BookingsModule {}

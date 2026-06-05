import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { PrismaModule } from './prisma/prisma.module'
import { HealthModule } from './health/health.module'
import { CategoriesModule } from './categories/categories.module'
import { MerchantsModule } from './merchants/merchants.module'
import { SearchModule } from './search/search.module'
import { AuthModule } from './auth/auth.module'
import { ReviewsModule } from './reviews/reviews.module'
import { FavoritesModule } from './favorites/favorites.module'
import { AdminModule } from './admin/admin.module'
import { ComplaintsModule } from './complaints/complaints.module'
import { OtpModule } from './otp/otp.module'
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    OtpModule,
    PrismaModule,
    HealthModule,
    AuthModule,
    CategoriesModule,
    MerchantsModule,
    SearchModule,
    ReviewsModule,
    FavoritesModule,
    AdminModule,
    ComplaintsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}

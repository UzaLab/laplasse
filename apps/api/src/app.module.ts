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
import { NotificationsModule } from './notifications/notifications.module'
import { LoyaltyModule } from './loyalty/loyalty.module'
import { ReferralModule } from './referral/referral.module'
import { PromotionsModule } from './promotions/promotions.module'
import { OrganizationsModule } from './organizations/organizations.module'
import { PaymentsModule } from './payments/payments.module'
import { BookingsModule } from './bookings/bookings.module'
import { QueueModule } from './queue/queue.module'
import { AuditModule } from './audit/audit.module'
import { FraudModule } from './fraud/fraud.module'
import { StaffModule } from './staff/staff.module'
import { AdsModule } from './ads/ads.module'
import { MarketplaceModule } from './marketplace/marketplace.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    OtpModule,
    PrismaModule,
    AuditModule,
    HealthModule,
    AuthModule,
    CategoriesModule,
    MerchantsModule,
    SearchModule,
    ReviewsModule,
    FavoritesModule,
    AdminModule,
    ComplaintsModule,
    NotificationsModule,
    LoyaltyModule,
    ReferralModule,
    PromotionsModule,
    OrganizationsModule,
    PaymentsModule,
    BookingsModule,
    QueueModule,
    FraudModule,
    StaffModule,
    AdsModule,
    MarketplaceModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}

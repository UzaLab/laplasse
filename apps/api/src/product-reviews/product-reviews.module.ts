import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { ProductReviewsController } from './product-reviews.controller'
import { ProductReviewsService } from './product-reviews.service'

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET') ?? 'laplasse-dev-secret',
      }),
    }),
  ],
  controllers: [ProductReviewsController],
  providers: [ProductReviewsService],
  exports: [ProductReviewsService],
})
export class ProductReviewsModule {}

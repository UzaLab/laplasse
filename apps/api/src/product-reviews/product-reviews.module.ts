import { Module } from '@nestjs/common'
import { ProductReviewsController } from './product-reviews.controller'
import { ProductReviewsService } from './product-reviews.service'
import { NotificationsModule } from '../notifications/notifications.module'

@Module({
  imports: [NotificationsModule],
  controllers: [ProductReviewsController],
  providers: [ProductReviewsService],
  exports: [ProductReviewsService],
})
export class ProductReviewsModule {}

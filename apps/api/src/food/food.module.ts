import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { FoodCronService } from './food-cron.service'
import { DeliveryModule } from '../delivery/delivery.module'

@Module({
  imports: [ScheduleModule.forRoot(), DeliveryModule],
  providers: [FoodCronService],
})
export class FoodModule {}

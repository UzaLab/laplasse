import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { AdsService } from './ads.service'
import { AdsController } from './ads.controller'

@Module({
  imports: [PrismaModule],
  controllers: [AdsController],
  providers: [AdsService],
  exports: [AdsService],
})
export class AdsModule {}

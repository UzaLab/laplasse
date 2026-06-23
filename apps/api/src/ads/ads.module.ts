import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { AuditModule } from '../audit/audit.module'
import { AdsService } from './ads.service'
import { AdsController } from './ads.controller'

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [AdsController],
  providers: [AdsService],
  exports: [AdsService],
})
export class AdsModule {}

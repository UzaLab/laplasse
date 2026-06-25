import { Module } from '@nestjs/common'
import { CrmService } from './crm.service'
import { PrismaModule } from '../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule {}

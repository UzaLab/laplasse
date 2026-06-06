import { Module } from '@nestjs/common'
import { PrismaModule } from '../prisma/prisma.module'
import { OrganizationsService } from './organizations.service'
import { OrganizationsController } from './organizations.controller'

@Module({
  imports: [PrismaModule],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}

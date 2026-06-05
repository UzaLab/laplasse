import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { ComplaintsModule } from '../complaints/complaints.module'
import { SearchModule } from '../search/search.module'
import { MerchantsModule } from '../merchants/merchants.module'

@Module({
  imports: [ComplaintsModule, SearchModule, MerchantsModule],
  controllers: [AdminController],
})
export class AdminModule {}

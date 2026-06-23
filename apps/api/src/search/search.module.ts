import { Module, forwardRef } from '@nestjs/common'
import { SearchController } from './search.controller'
import { SearchService } from './search.service'
import { AdsModule } from '../ads/ads.module'

@Module({
  imports: [forwardRef(() => AdsModule)],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}

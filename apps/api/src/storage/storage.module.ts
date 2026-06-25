import { Module } from '@nestjs/common'
import { StorageService } from './storage.service'
import { ImageProcessorService } from './image-processor.service'

@Module({
  providers: [ImageProcessorService, StorageService],
  exports: [StorageService],
})
export class StorageModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import storageConfig from 'src/config/storageConfig';
import { StorageService } from './storage.service';
import { StorageUploadController } from './storage-upload.controller';

@Module({
  imports: [ConfigModule.forFeature(storageConfig)],
  controllers: [StorageUploadController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}

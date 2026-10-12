import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import vectorConfig from 'src/config/vectorConfig';
import { VectorService } from './vector.service';

@Module({
  imports: [ConfigModule.forFeature(vectorConfig)],
  providers: [VectorService],
  exports: [VectorService],
})
export class VectorModule {}

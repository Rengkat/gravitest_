import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import searchConfig from 'src/config/searchConfig';
import { SearchService } from './search.service';

@Module({
  imports: [ConfigModule.forFeature(searchConfig)],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { PaginationModule } from 'src/common/pagination/pagination.module';
import { SiteContentModule } from 'src/site-content/site-content.module';

@Module({
  imports: [TypeOrmModule.forFeature([Post]), PaginationModule, SiteContentModule],
  controllers: [BlogController],
  providers: [BlogService],
  exports: [BlogService],
})
export class BlogModule {}

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { QUEUE_NAMES } from '../queue.constants';
import { ContentIndexingJob } from '../queue.service';
import { SearchService } from 'src/search/search.service';
import { LibraryContent } from 'src/library/entities/library-contnent.entity';

@Processor(QUEUE_NAMES.CONTENT_INDEXING)
export class ContentIndexingProcessor extends WorkerHost {
  private readonly logger = new Logger(ContentIndexingProcessor.name);

  constructor(
    @InjectRepository(LibraryContent)
    private readonly contentRepo: Repository<LibraryContent>,
    private readonly searchService: SearchService,
  ) {
    super();
  }

  async process(job: Job<ContentIndexingJob>): Promise<void> {
    const { action, contentId } = job.data;

    if (action === 'remove') {
      await this.searchService.removeLibraryContent(contentId);
      this.logger.log(`Removed ${contentId} from search index`);
      return;
    }

    const content = await this.contentRepo.findOne({ where: { id: contentId } });
    if (!content || !content.isPublished || !content.isActive) {
      // Content was unpublished/deleted between enqueue and processing.
      await this.searchService.removeLibraryContent(contentId);
      return;
    }

    await this.searchService.indexLibraryContent({
      id: content.id,
      title: content.title,
      description: content.description,
      contentType: content.contentType,
      subject: content.subject,
      topic: content.topic,
      examTypes: content.examTypes,
      classLevels: content.classLevels,
      isFree: content.isFree,
      thumbnailUrl: content.thumbnailUrl,
    });
    this.logger.log(`Indexed ${contentId} for search`);
  }
}

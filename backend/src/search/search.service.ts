import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { Meilisearch } from 'meilisearch';
import searchConfig from 'src/config/searchConfig';

export interface LibrarySearchDocument {
  id: string;
  title: string;
  description: string | null;
  contentType: string;
  subject: string | null;
  topic: string | null;
  examTypes: string[];
  classLevels: string[];
  isFree: boolean;
  thumbnailUrl: string | null;
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private readonly client: Meilisearch;

  constructor(
    @Inject(searchConfig.KEY) private readonly conf: ConfigType<typeof searchConfig>,
  ) {
    this.client = new Meilisearch({ host: this.conf.host, apiKey: this.conf.apiKey || undefined });
  }

  async onModuleInit() {
    // Idempotent: safe to run every boot. Failures here (Meilisearch not
    // provisioned yet) are logged, not fatal — search degrades to the
    // Postgres ILIKE fallback already used in LibraryService.buildQuery.
    try {
      await this.client.createIndex(this.conf.libraryIndex, { primaryKey: 'id' });
      const index = this.client.index(this.conf.libraryIndex);
      await index.updateFilterableAttributes([
        'contentType',
        'subject',
        'examTypes',
        'classLevels',
        'isFree',
      ]);
      await index.updateSearchableAttributes(['title', 'description', 'topic']);
    } catch (err) {
      this.logger.warn(
        `Meilisearch not reachable at ${this.conf.host} — falling back to Postgres search. (${(err as Error).message})`,
      );
    }
  }

  async indexLibraryContent(doc: LibrarySearchDocument): Promise<void> {
    try {
      await this.client.index(this.conf.libraryIndex).addDocuments([doc]);
    } catch (err) {
      this.logger.warn(`Failed to index library content ${doc.id}: ${(err as Error).message}`);
    }
  }

  async removeLibraryContent(id: string): Promise<void> {
    try {
      await this.client.index(this.conf.libraryIndex).deleteDocument(id);
    } catch (err) {
      this.logger.warn(`Failed to remove library content ${id} from index: ${(err as Error).message}`);
    }
  }

  async searchLibrary(
    query: string,
    filters?: { contentType?: string; subject?: string; isFree?: boolean },
  ): Promise<{ hits: LibrarySearchDocument[]; estimatedTotalHits: number }> {
    const filterClauses: string[] = [];
    if (filters?.contentType) filterClauses.push(`contentType = "${filters.contentType}"`);
    if (filters?.subject) filterClauses.push(`subject = "${filters.subject}"`);
    if (filters?.isFree !== undefined) filterClauses.push(`isFree = ${filters.isFree}`);

    const result = await this.client.index(this.conf.libraryIndex).search<LibrarySearchDocument>(query, {
      filter: filterClauses.length ? filterClauses.join(' AND ') : undefined,
      limit: 20,
    });

    return { hits: result.hits, estimatedTotalHits: result.estimatedTotalHits ?? result.hits.length };
  }
}

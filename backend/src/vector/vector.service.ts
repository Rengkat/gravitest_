import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import vectorConfig from 'src/config/vectorConfig';

export interface QuestionVectorPoint {
  id: string; // questionId (uuid)
  vector: number[]; // pre-computed embedding — this service does not generate embeddings
  payload: {
    subject: string;
    examType: string;
    topic: string | null;
    classLevel: string | null;
  };
}

// Thin Qdrant wrapper used for two things per the tech stack:
//  1. Semantic question search ("find questions like this one")
//  2. RAG grounding for the AI tutor / lesson-plan generator (retrieve
//     relevant curriculum/question context before calling the LLM)
// Embedding generation is intentionally NOT this service's job — call
// your chosen embedding model (e.g. Gemini gemini-embedding-2 with
// output_dimensionality=768 to match QDRANT_VECTOR_SIZE) in the
// caller (QuestionsService, AiRouterService) and pass the resulting
// vector in here. Keeps this service provider-agnostic.
@Injectable()
export class VectorService implements OnModuleInit {
  private readonly logger = new Logger(VectorService.name);
  private readonly client: QdrantClient;

  constructor(
    @Inject(vectorConfig.KEY) private readonly conf: ConfigType<typeof vectorConfig>,
  ) {
    this.client = new QdrantClient({ url: this.conf.url, apiKey: this.conf.apiKey });
  }

  async onModuleInit() {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some((c) => c.name === this.conf.questionsCollection);
      if (!exists) {
        await this.client.createCollection(this.conf.questionsCollection, {
          vectors: { size: this.conf.vectorSize, distance: 'Cosine' },
        });
        this.logger.log(`Created Qdrant collection "${this.conf.questionsCollection}"`);
      }
    } catch (err) {
      this.logger.warn(
        `Qdrant not reachable at ${this.conf.url} — semantic search/RAG will be unavailable until it's provisioned. (${(err as Error).message})`,
      );
    }
  }

  async upsertQuestion(point: QuestionVectorPoint): Promise<void> {
    try {
      await this.client.upsert(this.conf.questionsCollection, {
        points: [{ id: point.id, vector: point.vector, payload: point.payload }],
      });
    } catch (err) {
      this.logger.warn(`Failed to upsert question ${point.id} into Qdrant: ${(err as Error).message}`);
    }
  }

  async deleteQuestion(id: string): Promise<void> {
    try {
      await this.client.delete(this.conf.questionsCollection, { points: [id] });
    } catch (err) {
      this.logger.warn(`Failed to delete question ${id} from Qdrant: ${(err as Error).message}`);
    }
  }

  async searchSimilar(
    vector: number[],
    filters?: { subject?: string; examType?: string },
    limit = 10,
  ): Promise<Array<{ id: string; score: number; payload: QuestionVectorPoint['payload'] }>> {
    const must: Array<{ key: string; match: { value: string } }> = [];
    if (filters?.subject) must.push({ key: 'subject', match: { value: filters.subject } });
    if (filters?.examType) must.push({ key: 'examType', match: { value: filters.examType } });

    const result = await this.client.query(this.conf.questionsCollection, {
      query: vector,
      filter: must.length ? { must } : undefined,
      limit,
      with_payload: true,
    });

    return result.points.map((r) => ({
      id: String(r.id),
      score: r.score,
      payload: r.payload as unknown as QuestionVectorPoint['payload'],
    }));
  }
}

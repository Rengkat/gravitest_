import { registerAs } from '@nestjs/config';

export default registerAs('search', () => ({
  host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_API_KEY || '',
  libraryIndex: process.env.MEILISEARCH_LIBRARY_INDEX || 'library_contents',
  questionsIndex: process.env.MEILISEARCH_QUESTIONS_INDEX || 'questions',
}));

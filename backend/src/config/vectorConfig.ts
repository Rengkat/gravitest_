import { registerAs } from '@nestjs/config';

export default registerAs('vector', () => ({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY || undefined,
  questionsCollection: process.env.QDRANT_QUESTIONS_COLLECTION || 'questions',
  // Match this to whatever embedding model you call before upserting —
  // e.g. 768 for Gemini `gemini-embedding-2` called with
  // output_dimensionality=768 (text-embedding-004 was shut down in Jan 2026;
  // its replacement defaults to 3072, so ask for 768 explicitly), 1536 for
  // OpenAI text-embedding-3-small. Wrong dimension = Qdrant rejects the upsert.
  // Vectors from different embedding models are NOT comparable — switching
  // models means re-embedding everything.
  vectorSize: parseInt(process.env.QDRANT_VECTOR_SIZE || '768', 10),
}));

// Central place for queue names so producers and processors never
// typo-diverge. Add a new constant here whenever a new queue is needed.
export const QUEUE_NAMES = {
  EMAIL: 'email',
  PDF_GENERATION: 'pdf-generation',
  AI_BACKGROUND: 'ai-background',
  CONTENT_INDEXING: 'content-indexing',
  LIBRARY_PREVIEW: 'library-preview',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

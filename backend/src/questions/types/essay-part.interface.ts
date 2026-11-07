export interface EssayPart {
  /** Permanent identifier, assigned server-side (see assignPartIds). Never derived from position or label. */
  id?: string;
  label: string;
  text?: string | null;
  imageUrl?: string | null;
  table?: string[][] | null;
  maxScore?: number | null;
  children?: EssayPart[];
}

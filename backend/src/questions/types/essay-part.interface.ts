export interface EssayPart {
  label: string;
  text?: string | null;
  imageUrl?: string | null;
  table?: string[][] | null;
  maxScore?: number | null;
  children?: EssayPart[];
}

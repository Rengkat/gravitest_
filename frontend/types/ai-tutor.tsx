export type Subject =
  | "general"
  | "mathematics"
  | "physics"
  | "chemistry"
  | "biology"
  | "english"
  | "economics"
  | "government"
  | "literature"
  | "history";

export type Difficulty = "beginner" | "intermediate" | "advanced" | "expert";
export type ResponseStyle = "detailed" | "concise" | "step-by-step" | "examples";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  subject?: Subject;
  feedback?: "like" | "dislike";
  streaming?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
  subject: Subject;
}

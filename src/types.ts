export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
}

export type ReflectionCategory =
  | "reflection"
  | "brainstorm"
  | "coaching"
  | "action_plan"
  | "gratitude"
  | "freeform";

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: number;
  modelUsed?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  category: ReflectionCategory;
  initialPrompt?: string;
  messages: ChatMessage[];
  summary?: string;
  keyInsights?: string[];
  actionItems?: string[];
  sentimentTag?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
  isFavorite?: boolean;
  wordCount?: number;
}

export interface SummaryResult {
  suggestedTitle: string;
  summary: string;
  keyInsights: string[];
  actionItems: string[];
  sentimentTag: string;
  tags: string[];
  modelUsed?: string;
}

export interface PromptIdea {
  title: string;
  prompt: string;
  category: string;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

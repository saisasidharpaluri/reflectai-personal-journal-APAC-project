import { ChatMessage, ReflectionCategory, SummaryResult, PromptIdea } from "../types";

export interface SendChatParams {
  messages: Array<{ role: string; content: string }>;
  mode?: ReflectionCategory;
  userContext?: string;
  customPrompt?: string;
}

export interface ChatResponse {
  reply: string;
  modelUsed: string;
  timestamp: string;
}

export async function sendChatMessage(params: SendChatParams): Promise<ChatResponse> {
  const response = await fetch("/api/gemini/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Network request failed" }));
    throw new Error(errorData.error || `Server responded with status ${response.status}`);
  }

  return response.json();
}

export async function generateEntrySummary(params: {
  title?: string;
  content?: string;
  messages?: ChatMessage[];
}): Promise<SummaryResult> {
  const response = await fetch("/api/gemini/summarize", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Summarization failed" }));
    throw new Error(errorData.error || `Summarization failed with status ${response.status}`);
  }

  return response.json();
}

export async function fetchPromptIdeas(category: string = "general"): Promise<PromptIdea[]> {
  const response = await fetch("/api/gemini/prompt-ideas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ category }),
  });

  if (!response.ok) {
    return [
      { title: "Today's Core Priority", prompt: "What is the single most meaningful focus for your energy today, and why?", category },
      { title: "Unspoken Tension", prompt: "What is an underlying tension or feeling you haven't fully acknowledged yet?", category },
      { title: "Celebration of Growth", prompt: "What is a small victory or moment of progress from this week?", category },
      { title: "Future Perspective", prompt: "Looking back on today from 5 years in the future, what advice would you give yourself?", category },
    ];
  }

  const data = await response.json();
  return data.prompts || [];
}

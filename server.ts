import express, { Request, Response } from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import {
  generateSmartReflection,
  generateSmartSummary,
  generateSmartPromptIdeas,
} from "./src/lib/offlineReflection";

dotenv.config();

const app = express();
const PORT = 3000;

// 1. Top-Level Request Deserialization (Ordering Guarantee)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Gemini SDK Lazy Initializer
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Resilient Model Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  "gemini-3.6-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.7-flash",
];

interface FallbackOptions {
  contents: any;
  systemInstruction?: string;
  temperature?: number;
}

async function generateContentWithFallback(options: FallbackOptions): Promise<{ text: string; modelUsed: string; quotaExhausted?: boolean }> {
  let lastError: any = null;
  let isQuotaExhausted = false;

  try {
    const ai = getGenAI();

    for (const modelName of MODEL_FALLBACK_LADDER) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: options.contents,
          config: {
            systemInstruction: options.systemInstruction,
            temperature: options.temperature ?? 0.7,
          },
        });

        const responseText = response.text || "";
        return { text: responseText, modelUsed: modelName };
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        console.warn(`[Gemini Fallback] Model ${modelName} encountered an error:`, errMsg);
        lastError = err;

        if (
          errMsg.includes("RESOURCE_EXHAUSTED") ||
          errMsg.includes("prepayment credits are depleted") ||
          errMsg.includes("429")
        ) {
          isQuotaExhausted = true;
        }
      }
    }
  } catch (initErr: any) {
    console.warn("[Gemini Init Warning]:", initErr?.message || initErr);
    lastError = initErr;
  }

  const errDetail = lastError?.message || "All Gemini models failed or key unconfigured.";
  const errorToThrow = new Error(errDetail);
  (errorToThrow as any).quotaExhausted = isQuotaExhausted;
  throw errorToThrow;
}

// API Health Check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString(),
  });
});

// Multi-turn Reflection & Chat Endpoint
app.post("/api/gemini/chat", async (req: Request, res: Response) => {
  const payload = (req.body && typeof req.body === "object") ? req.body : {};
  const {
    messages = [],
    mode = "reflection",
    userContext = "",
    customPrompt = "",
  } = payload;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Invalid payload: 'messages' array must not be empty." });
  }

  try {
    // Determine system instruction based on mode
    let systemInstruction = `You are a compassionate, thoughtful, and insightful AI Reflection Companion named ReflectAI. 
Your purpose is to help the user unpack their thoughts, gain clarity, explore ideas deeply, and discover meaningful perspectives.
Keep your tone warm, grounded, constructive, non-judgmental, and engaging.
Use rich markdown formatting where appropriate (bullet points, bold highlights, reflective questions).`;

    if (mode === "brainstorm") {
      systemInstruction += `\nMode: CREATIVE BRAINSTORMING. Provide divergent ideas, innovative angles, potential solutions, and structured outlines.`;
    } else if (mode === "coaching") {
      systemInstruction += `\nMode: REFLECTION COACH. Ask 2-3 deep, open-ended thought questions, identify underlying assumptions, and offer compassionate perspective reframings.`;
    } else if (mode === "action_plan") {
      systemInstruction += `\nMode: ACTION PLANNER. Break reflections down into pragmatic, actionable steps, prioritized milestones, and potential obstacles.`;
    } else if (mode === "summary") {
      systemInstruction += `\nMode: SYNTHESIS & INSIGHT. Synthesize main emotional threads, key decisions, and central themes.`;
    }

    if (userContext) {
      systemInstruction += `\nContext for this session: ${userContext}`;
    }

    // Format messages for @google/genai
    const formattedContents = messages.map((m: any) => ({
      role: m.role === "model" || m.role === "assistant" ? "model" : "user",
      parts: [{ text: String(m.content || "") }],
    }));

    if (customPrompt) {
      formattedContents.push({
        role: "user",
        parts: [{ text: String(customPrompt) }],
      });
    }

    const { text, modelUsed } = await generateContentWithFallback({
      contents: formattedContents,
      systemInstruction,
    });

    return res.json({
      reply: text,
      modelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.warn("[API /api/gemini/chat] Gemini API unavailable, engaging intelligent reflection engine:", error?.message);
    
    // Graceful fallback to rich structured cognitive reflection so user can continue journaling smoothly
    const fallbackResponse = generateSmartReflection({
      messages,
      mode,
      userContext,
    });

    return res.json({
      reply: fallbackResponse.text,
      modelUsed: fallbackResponse.modelUsed,
      isFallback: true,
      notice: "Live reflection generated via built-in cognitive companion.",
      timestamp: new Date().toISOString(),
    });
  }
});

// Entry Summarization & Insights Generator Endpoint
app.post("/api/gemini/summarize", async (req: Request, res: Response) => {
  const payload = (req.body && typeof req.body === "object") ? req.body : {};
  const { title = "", content = "", messages = [] } = payload;

  const transcript = messages.length > 0
    ? messages.map((m: any) => `${m.role === "model" ? "ReflectAI" : "User"}: ${m.content}`).join("\n\n")
    : content;

  if (!transcript.trim()) {
    return res.status(400).json({ error: "Content or message transcript is required for summarization." });
  }

  try {
    const systemInstruction = `You are an expert cognitive synthesizer and journaling analyst. 
Analyze the provided journal entry or reflection conversation and return a structured summary.
You MUST output valid JSON with the exact following schema:
{
  "suggestedTitle": "A concise, evocative 4-8 word title",
  "summary": "A 2-3 sentence overarching summary of the reflection",
  "keyInsights": ["Insight 1", "Insight 2", "Insight 3"],
  "actionItems": ["Actionable step 1", "Actionable step 2"],
  "sentimentTag": "Optimistic" | "Thoughtful" | "Challenged" | "Determined" | "Calm" | "Grateful" | "Energized" | "Reflective",
  "tags": ["Tag1", "Tag2", "Tag3"]
}
Do NOT output any markdown backticks or extra text outside the JSON object.`;

    const userPrompt = `Existing Title: ${title || "Untitled"}\n\nReflection Transcript:\n${transcript}`;

    const { text, modelUsed } = await generateContentWithFallback({
      contents: userPrompt,
      systemInstruction,
      temperature: 0.3,
    });

    // Parse JSON safely
    let parsed: any;
    try {
      const cleanJson = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      parsed = generateSmartSummary({ title, content, messages });
    }

    return res.json({
      ...parsed,
      modelUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.warn("[API /api/gemini/summarize] Gemini API unavailable, generating smart cognitive summary:", error?.message);
    const smartSummary = generateSmartSummary({ title, content, messages });
    return res.json({
      ...smartSummary,
      isFallback: true,
      timestamp: new Date().toISOString(),
    });
  }
});

// Prompt Inspiration Endpoint
app.post("/api/gemini/prompt-ideas", async (req: Request, res: Response) => {
  const payload = (req.body && typeof req.body === "object") ? req.body : {};
  const { category = "general" } = payload;

  try {
    const systemInstruction = `You are a creative journal prompt curator. Provide 4 thoughtful, evocative reflection prompts suitable for category: ${category}.
Output strictly valid JSON with the format:
{
  "prompts": [
    { "title": "Short title", "prompt": "Deep opening question or journaling prompt", "category": "${category}" }
  ]
}`;

    const { text } = await generateContentWithFallback({
      contents: `Generate 4 inspirational prompts for category: ${category}`,
      systemInstruction,
      temperature: 0.8,
    });

    let result = { prompts: [] };
    try {
      const cleanJson = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      result = JSON.parse(cleanJson);
    } catch {
      result = { prompts: generateSmartPromptIdeas(category) as any };
    }

    return res.json(result);
  } catch (error: any) {
    console.warn("[API /api/gemini/prompt-ideas] Gemini API unavailable, serving built-in prompt catalog:", error?.message);
    const prompts = generateSmartPromptIdeas(category);
    return res.json({ prompts, isFallback: true });
  }
});

// Vite middleware & Static Serving Integration
async function setupViteMiddleware() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ReflectAI Server successfully listening on http://0.0.0.0:${PORT}`);
  });
}

setupViteMiddleware().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

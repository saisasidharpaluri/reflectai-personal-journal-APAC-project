// Autonomous and intelligent rule-based reflection engine for offline / quota-limited mode
// Provides intelligent structured reflective responses, insightful prompts, summaries, and action plans

export interface ReflectionGenerationOptions {
  messages: Array<{ role: string; content: string }>;
  mode?: string;
  userContext?: string;
}

export interface SummaryGenerationOptions {
  title?: string;
  content?: string;
  messages?: Array<{ role: string; content: string }>;
}

export interface StructuredSummary {
  suggestedTitle: string;
  summary: string;
  keyInsights: string[];
  actionItems: string[];
  sentimentTag: string;
  tags: string[];
  modelUsed: string;
}

export function generateSmartReflection(options: ReflectionGenerationOptions): { text: string; modelUsed: string } {
  const { messages, mode = "reflection" } = options;
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content || "";
  const lowerText = lastUserMessage.toLowerCase();

  // Detect key sentiment & context triggers
  const isQuestion = lastUserMessage.includes("?");
  const mentionsStressOrAnxiety = /(stress|overwhelm|anxious|tired|burnout|exhaust|pressure|deadline|worry|struggle)/i.test(lowerText);
  const mentionsGoalOrDecision = /(goal|decision|choice|plan|future|career|project|focus|stuck|choose|option)/i.test(lowerText);
  const mentionsGratitude = /(thankful|grateful|happy|proud|win|achieve|excited|peace|joy|blessed)/i.test(lowerText);
  const mentionsRelationship = /(friend|partner|colleague|team|boss|family|communication|conflict|person)/i.test(lowerText);

  let responseBody = "";

  if (mode === "brainstorm") {
    responseBody = `### 💡 Creative Brainstorming & Possibilities

Here are dynamic angles and exploratory branches based on what you shared:

1. **The Inversion Angle**: What happens if you do the exact opposite of the conventional approach? Where does that reveal hidden assumptions?
2. **The Minimum Viable Step**: If you could only spend 15 focused minutes on this tomorrow, what single high-leverage action would create the most momentum?
3. **The 10x Scale Perspective**: How would this challenge look if resources were unlimited, or if you simplified the goal to its absolute core?
4. **Alternative Pathways**: Consider separating the problem into *immediate experiments* versus *long-term commitments*.

> **Reflection Prompt**: *Which of these angles feels most energizing to explore further right now?*`;
  } else if (mode === "action_plan") {
    responseBody = `### 🎯 Pragmatic Action Roadmap

Let's distill your thoughts into tangible, prioritized milestones:

1. **Immediate Focus (Next 24 Hours)**:
   - Clarify the single most critical deliverable or decision.
   - Eliminate or delegate one non-essential distraction.

2. **Short-Term Horizon (This Week)**:
   - Block out dedicated deep-work time to build initial momentum.
   - Establish a simple checkpoint to review progress objectively.

3. **Potential Obstacles & Safeguards**:
   - *Risk*: Decision fatigue or overcomplicating the first step.
   - *Safeguard*: Commit to progress over perfection.

> **Next Step**: *What is the first 5-minute task you can initiate right away?*`;
  } else if (mode === "coaching") {
    if (mentionsStressOrAnxiety) {
      responseBody = `### 🌿 Grounded Reflection & Coaching

It sounds like you are carrying a notable amount of weight right now. Let's pause, ground ourselves, and look at the underlying dynamics:

- **What is within your control right now?** Separate what you can influence directly from the external factors that are draining your attention.
- **What expectation are you placing on yourself?** Is that expectation realistic given your current bandwidth and energy?

> **Deep Question**: *If you allowed yourself to set down just one secondary obligation today, which one would give you the most breathing room?*`;
    } else if (mentionsGoalOrDecision) {
      responseBody = `### 🧭 Clarity & Decision Coaching

When navigating meaningful choices, clarity often comes from testing values rather than predicting outcomes:

- **The Core Value Test**: Which path aligns most closely with who you want to become over the next 3 years?
- **The Regret Minimization Check**: If you look back from one year in the future, which choice will you be proudest of having tried?

> **Deep Question**: *What is your intuition telling you when you silence the fear of making a mistake?*`;
    } else {
      responseBody = `### 🔍 Exploratory Coaching Questions

Thank you for articulating this so clearly. To help you dive deeper into this reflection:

1. What is the unspoken feeling or instinct behind these thoughts?
2. What would a breakthrough in this area look or feel like for you?
3. What is a truth about this situation that you might be hesitating to fully acknowledge?

> Take your time to write down whatever comes to mind first.`;
    }
  } else {
    // Default mode: Reflection / Gratitude / Freeform
    if (mentionsGratitude) {
      responseBody = `### ✨ Gratitude & Affirmation

Acknowledging these moments of positivity and progress is deeply grounding. 

- Savor the effort and intention that brought you to this point.
- Notice how recognizing wins creates a steady foundation for whatever comes next.

> **Reflection Anchor**: *How can you carry this sense of appreciation into the rest of your week?*`;
    } else if (mentionsStressOrAnxiety) {
      responseBody = `### ☕ Compassionate Processing

Thank you for sharing this honestly. It takes courage to put feelings of tension or overwhelm into words.

- Remember that feelings of pressure are signals, not definitions of your capability.
- Giving voice to these thoughts is the first step toward releasing their weight.

> **Reflective Question**: *What does your mind and body need most at this exact moment—rest, clarity, or gentle action?*`;
    } else if (mentionsRelationship) {
      responseBody = `### 🤝 Relational Insights

Navigating interpersonal dynamics requires balance between empathy for others and honoring your own boundaries:

- How can you express your perspective clearly while remaining open to understanding theirs?
- What is the most constructive outcome for all involved?

> **Thought Question**: *What is one assumption you might test before having your next conversation?*`;
    } else {
      responseBody = `### 📝 Reflection Companion

You've captured some thoughtful insights here. As we unpack this further:

- What stands out to you as the central theme in what you just wrote?
- How has your perspective on this evolved recently?

> **Reflective Inquiry**: *What is the most important takeaway you want to remember from today's contemplation?*`;
    }
  }

  return {
    text: responseBody,
    modelUsed: "reflective-intelligence-core (standby)",
  };
}

export function generateSmartSummary(options: SummaryGenerationOptions): StructuredSummary {
  const { title = "", content = "", messages = [] } = options;

  const allText = messages.length > 0
    ? messages.map((m) => m.content).join(" ")
    : content;

  const lower = allText.toLowerCase();

  // Extract key sentences or themes
  const hasAction = /(plan|step|todo|action|start|focus|build|organize|schedule)/i.test(lower);
  const hasEmotions = /(feel|felt|emotion|stress|happy|grateful|anxious|calm|overwhelm)/i.test(lower);
  const hasLearning = /(learned|realized|clarity|discovered|understand|noticed|perspective)/i.test(lower);

  let sentimentTag = "Reflective";
  if (/(happy|win|grateful|blessed|excited|proud)/i.test(lower)) sentimentTag = "Grateful";
  else if (/(goal|plan|determined|focus|execute|build)/i.test(lower)) sentimentTag = "Determined";
  else if (/(stress|overwhelm|tired|struggle)/i.test(lower)) sentimentTag = "Challenged";
  else if (/(peace|calm|quiet|grounded|relax)/i.test(lower)) sentimentTag = "Calm";
  else if (/(thought|wonder|curious|explore|idea)/i.test(lower)) sentimentTag = "Thoughtful";

  const suggestedTitle = title && title !== "New Reflection" 
    ? title 
    : (allText.slice(0, 35).trim() + " Session");

  const summary = `Synthesized exploration centered on ${allText.slice(0, 100).trim()}... Highlighting self-awareness, intentional prioritization, and mindful clarity throughout the reflection.`;

  const keyInsights = [
    hasLearning ? "Recognized meaningful personal patterns through structured self-examination." : "Gained clarity by putting complex thoughts into focused writing.",
    hasEmotions ? "Honored current emotional landscape without premature judgment." : "Identified the primary sources of focus and attention.",
    "Established a clearer perspective on near-term priorities.",
  ];

  const actionItems = hasAction
    ? [
        "Carve out protected focus time for the top priority identified in this reflection.",
        "Check in on this thought process in 48 hours to evaluate continued resonance.",
      ]
    : [
        "Pause for 5 minutes to ground before transitioning to your next task.",
        "Revisit these insights when planning upcoming weekly milestones.",
      ];

  const tags = ["journal", "reflection", sentimentTag.toLowerCase()];
  if (hasAction) tags.push("action-plan");
  if (hasEmotions) tags.push("mindfulness");

  return {
    suggestedTitle,
    summary,
    keyInsights,
    actionItems,
    sentimentTag,
    tags,
    modelUsed: "reflective-synthesis-engine (standby)",
  };
}

export function generateSmartPromptIdeas(category: string = "general") {
  const promptMap: Record<string, Array<{ title: string; prompt: string; category: string }>> = {
    reflection: [
      { title: "Inner Alignment", prompt: "What is currently demanding your mental energy, and how can you approach it with more ease?", category: "reflection" },
      { title: "Unspoken Insight", prompt: "What is something you intuitively know right now that you haven't yet put into words?", category: "reflection" },
      { title: "Recent Milestone", prompt: "What is a quiet piece of progress you achieved recently that deserves acknowledgment?", category: "reflection" },
      { title: "Perspective Shift", prompt: "If you stepped back and looked at your current week with total compassion, what would you notice?", category: "reflection" },
    ],
    brainstorm: [
      { title: "Zero-Constraint Ideas", prompt: "If there were zero limitations on time or resources, what bold approach would you try first?", category: "brainstorm" },
      { title: "Simplicity First", prompt: "How can you strip this concept down to its single most essential, impactful version?", category: "brainstorm" },
      { title: "Counter-Intuitive Angles", prompt: "What is the most unconventional solution that might actually work?", category: "brainstorm" },
      { title: "Adjacent Possibilities", prompt: "What similar challenges in other domains have solved a problem like this?", category: "brainstorm" },
    ],
    coaching: [
      { title: "Core Assumptions", prompt: "What belief are you holding about this situation that might not be 100% true?", category: "coaching" },
      { title: "Energy Audit", prompt: "Which activities or commitments energized you this week, and which drained you?", category: "coaching" },
      { title: "Future Guidance", prompt: "What counsel would the version of you from 5 years in the future offer you right now?", category: "coaching" },
      { title: "The High-Road Step", prompt: "What is the most constructive, integrity-aligned step you can take today?", category: "coaching" },
    ],
    action_plan: [
      { title: "The 24-Hour Catalyst", prompt: "What is one concrete, high-leverage action you can complete before the day ends?", category: "action_plan" },
      { title: "Eliminating Friction", prompt: "What obstacle is most likely to slow you down, and how will you bypass it?", category: "action_plan" },
      { title: "Milestone Definition", prompt: "What will 'done and successful' look like at the end of this sprint?", category: "action_plan" },
      { title: "Accountability Loop", prompt: "How will you track your commitment to ensure steady follow-through?", category: "action_plan" },
    ],
    gratitude: [
      { title: "Micro-Joy", prompt: "What small, ordinary moment brought you unexpected comfort or delight recently?", category: "gratitude" },
      { title: "Unsung Support", prompt: "Who is someone whose presence, work, or kindness made your life easier this week?", category: "gratitude" },
      { title: "Overcoming Adversity", prompt: "What past difficulty did you successfully navigate that makes you stronger today?", category: "gratitude" },
      { title: "Present Anchor", prompt: "What is something reliable and steady in your life that you are thankful for right now?", category: "gratitude" },
    ],
  };

  return promptMap[category] || promptMap.reflection;
}

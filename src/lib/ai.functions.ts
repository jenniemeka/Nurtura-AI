import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ChatSchema = z.object({
  conversationId: z.string().uuid().optional(),
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1).max(4000),
  })).min(1).max(40),
});

const SYSTEM_PROMPT = `You are Nurtura, a warm, supportive AI parenting companion for new and expecting parents.
- Be calm, gentle, and reassuring. Acknowledge feelings before giving information.
- Offer educational guidance about infant wellness, feeding, sleep, milestones, and development.
- Never diagnose. When something could be medical, recommend speaking to a pediatrician or qualified professional.
- Flag any red flags (high fever in young babies, breathing trouble, dehydration, decreased fetal movement) with clear urgency.
- Keep answers concise (under 180 words) and structured. Use short paragraphs or 3-5 bullets.
- Ground tips in mainstream pediatric guidance (AAP/WHO). Avoid cultural assumptions; be inclusive.`;

export const askAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ChatSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    let conversationId = data.conversationId;
    if (!conversationId) {
      const { data: convo, error } = await supabase
        .from("ai_conversations")
        .insert({ user_id: userId, title: data.messages[0].content.slice(0, 60) })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      conversationId = convo.id;
    }

    const lastUser = data.messages[data.messages.length - 1];
    if (lastUser.role === "user") {
      await supabase.from("ai_messages").insert({
        conversation_id: conversationId,
        user_id: userId,
        role: "user",
        content: lastUser.content,
      });
    }

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...data.messages,
        ],
      }),
    });

    if (!res.ok) {
      if (res.status === 429) return { error: "Too many requests. Please try again in a moment.", conversationId, reply: null };
      if (res.status === 402) return { error: "AI credits exhausted. Add credits in workspace settings.", conversationId, reply: null };
      const t = await res.text();
      console.error("AI gateway error:", res.status, t);
      return { error: "AI is temporarily unavailable.", conversationId, reply: null };
    }

    const json = await res.json();
    const reply: string = json.choices?.[0]?.message?.content ?? "";

    if (reply) {
      await supabase.from("ai_messages").insert({
        conversation_id: conversationId,
        user_id: userId,
        role: "assistant",
        content: reply,
      });
    }

    return { reply, conversationId, error: null };
  });

const SuggestSchema = z.object({ babyAgeMonths: z.number().min(-9).max(72).optional() });

export const suggestPrompts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SuggestSchema.parse(input))
  .handler(async ({ data }) => {
    const age = data.babyAgeMonths;
    if (age === undefined || age < 0) {
      return { prompts: [
        "How should I prepare for my third trimester?",
        "What helps with morning sickness?",
        "When should I pack my hospital bag?",
        "How do I tell real contractions from Braxton-Hicks?",
      ] };
    }
    if (age < 3) return { prompts: [
      "Why won't my baby latch?",
      "How much sleep is normal at this age?",
      "Is it okay if my baby cries a lot in the evening?",
      "What's a safe sleeping position?",
    ] };
    if (age < 6) return { prompts: [
      "Is my baby ready for solids?",
      "How do I handle the 4-month sleep regression?",
      "What is tummy time and how often should we do it?",
      "When should my baby roll over?",
    ] };
    return { prompts: [
      "What are common first foods?",
      "When should my baby start crawling?",
      "How can I support speech development?",
      "How much milk do they still need?",
    ] };
  });

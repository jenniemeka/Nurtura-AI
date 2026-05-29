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

const BASE_SYSTEM = `You are Nurtura, a warm, supportive AI companion for new, expecting, and postpartum parents.
- Be calm, gentle, and reassuring. Acknowledge feelings before giving information.
- Offer educational guidance on pregnancy (antenatal care, nutrition, prenatal exercise, labor prep), infant wellness, feeding, sleep, milestones, and development.
- Never diagnose. When something could be medical, recommend speaking to an OB-GYN, midwife, or pediatrician.
- Flag red flags clearly: in pregnancy — heavy bleeding, severe headache, vision changes, sudden swelling, reduced fetal movement, contractions before 37 weeks, water breaking; in babies — high fever in young infants, breathing trouble, dehydration.
- Keep answers concise (under 180 words), short paragraphs or 3-5 bullets.
- Ground tips in mainstream guidance (ACOG, AAP, WHO). Avoid cultural assumptions; be inclusive.`;

function babyAgeMonths(b?: { is_pregnancy?: boolean; birth_date?: string | null; pregnancy_due_date?: string | null }) {
  if (!b) return null;
  if (b.is_pregnancy) return -1;
  if (!b.birth_date) return null;
  return (Date.now() - new Date(b.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
}

function ageBand(m: number | null): string {
  if (m === null) return "unknown stage";
  if (m < 0) return "pregnancy";
  if (m < 3) return "newborn (0-2 months)";
  if (m < 6) return "young infant (3-5 months)";
  if (m < 12) return "older infant (6-11 months)";
  if (m < 24) return "toddler (12-23 months)";
  return "young child (2+ years)";
}

export type ClinicianGuidance = {
  week: number;
  trimester: 1 | 2 | 3;
  callClinician: string[];
  goToER: string[];
  reminder: string;
};

export function clinicianGuidanceFor(week: number): ClinicianGuidance {
  const tri = (week < 14 ? 1 : week < 28 ? 2 : 3) as 1 | 2 | 3;
  const commonER = [
    "Heavy vaginal bleeding (soaking a pad in an hour)",
    "Severe or persistent headache with vision changes",
    "Sudden swelling of face or hands, or sharp upper-belly pain",
    "Fever above 38°C / 100.4°F that won't come down",
    "Trouble breathing, chest pain, or fainting",
  ];
  if (tri === 1) {
    return {
      week,
      trimester: 1,
      callClinician: [
        "Spotting that turns into bleeding heavier than a light period",
        "One-sided sharp pelvic pain (possible ectopic pregnancy)",
        "Vomiting so often you can't keep fluids down for 24 hours",
        "Burning when you pee or new pelvic pressure",
      ],
      goToER: commonER,
      reminder: "Educational guidance, not a medical diagnosis. When in doubt, call your OB-GYN or midwife.",
    };
  }
  if (tri === 2) {
    return {
      week,
      trimester: 2,
      callClinician: [
        "Reduced fetal movement once you've started feeling regular kicks (usually 18–22 weeks)",
        "Leaking fluid from the vagina",
        "Regular tightenings or cramping before 37 weeks",
        "Any new bleeding, even light",
      ],
      goToER: commonER,
      reminder: "Educational guidance, not a medical diagnosis. Trust your instincts — call your clinician any time something feels off.",
    };
  }
  return {
    week,
    trimester: 3,
    callClinician: [
      week < 37
        ? "Regular contractions, pelvic pressure, or low back pain before 37 weeks (preterm labor signs)"
        : "Regular contractions about 5 minutes apart for an hour (likely labor — call L&D)",
      "Noticeable drop in fetal movements during a kick count",
      "Sudden gush or steady trickle of fluid (possible water breaking)",
    ],
    goToER: [
      ...commonER,
      "Any vaginal bleeding",
      "A clear drop in fetal movement that doesn't recover after a snack, drink, and 30 minutes of focus",
    ],
    reminder: "Educational guidance, not a medical diagnosis. After 37 weeks, your L&D team would rather hear from you twice than not at all.",
  };
}

function safetyToPrompt(g: ClinicianGuidance): string {
  return [
    `Week ${g.week} (trimester ${g.trimester}) clinician guidance to attach to every response:`,
    `- Call your clinician for: ${g.callClinician.join("; ")}.`,
    `- Go to L&D / ER for: ${g.goToER.join("; ")}.`,
    `- Reminder: ${g.reminder}`,
  ].join("\n");
}

async function buildPersonalContext(supabase: any, userId: string): Promise<{ system: string; guidance: ClinicianGuidance | null }> {
  const [{ data: profile }, { data: babies }] = await Promise.all([
    supabase.from("profiles").select("parent_name, concerns, concerns_notes, support_level").eq("id", userId).maybeSingle(),
    supabase.from("babies").select("name, is_pregnancy, birth_date, pregnancy_due_date").eq("user_id", userId).order("created_at").limit(1),
  ]);
  const baby = babies?.[0];
  const months = babyAgeMonths(baby);
  const parts: string[] = ["User context (use to tailor tone & examples; do not echo verbatim):"];
  if (profile?.parent_name) parts.push(`- Parent: ${profile.parent_name}`);
  let guidance: ClinicianGuidance | null = null;
  if (baby?.is_pregnancy && baby?.pregnancy_due_date) {
    const daysLeft = Math.round((new Date(baby.pregnancy_due_date).getTime() - Date.now()) / 86400000);
    const week = Math.max(1, Math.min(42, 40 - Math.round(daysLeft / 7)));
    guidance = clinicianGuidanceFor(week);
    parts.push(`- PREGNANCY MODE: ~week ${week} (trimester ${guidance.trimester}), ${daysLeft} days to due date. Prioritize antenatal guidance and pregnancy safety.`);
  } else if (baby?.name) {
    parts.push(`- Baby: ${baby.name} — stage: ${ageBand(months)}${months !== null && months >= 0 ? ` (~${Math.round(months)} months)` : ""}`);
  }
  if (profile?.concerns?.length) parts.push(`- Top concerns: ${profile.concerns.join(", ")}`);
  if (profile?.support_level) parts.push(`- Self-reported support level (1=overwhelmed, 5=confident): ${profile.support_level}. Adjust warmth accordingly.`);
  if (profile?.concerns_notes) parts.push(`- Notes from parent: ${profile.concerns_notes}`);
  if (guidance) {
    parts.push("");
    parts.push("MANDATORY for every pregnancy response: end with a short `Safety check` section paraphrasing the week-specific guidance below, and remind the user this is educational, not a medical diagnosis. The app will also render a structured clinician guidance card alongside your response.");
    parts.push(safetyToPrompt(guidance));
  }
  return { system: parts.length > 1 ? parts.join("\n") : "", guidance };
}


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

    const personal = await buildPersonalContext(supabase, userId);
    const system = personal ? `${BASE_SYSTEM}\n\n${personal}` : BASE_SYSTEM;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
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

export const suggestPrompts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: babies }] = await Promise.all([
      supabase.from("profiles").select("concerns").eq("id", userId).maybeSingle(),
      supabase.from("babies").select("is_pregnancy, birth_date").eq("user_id", userId).order("created_at").limit(1),
    ]);
    const months = babyAgeMonths(babies?.[0]);
    const concerns: string[] = profile?.concerns ?? [];

    const base: string[] = [];
    if (months === null || months < 0) {
      base.push(
        "How should I prepare for my third trimester?",
        "What helps with morning sickness?",
        "When should I pack my hospital bag?",
        "How do I tell real contractions from Braxton-Hicks?",
      );
    } else if (months < 3) {
      base.push(
        "Why won't my baby latch?",
        "How much sleep is normal at this age?",
        "Is it okay if my baby cries a lot in the evening?",
        "What's a safe sleeping position?",
      );
    } else if (months < 6) {
      base.push(
        "Is my baby ready for solids?",
        "How do I handle the 4-month sleep regression?",
        "What is tummy time and how often should we do it?",
        "When should my baby roll over?",
      );
    } else if (months < 12) {
      base.push(
        "What are common first foods?",
        "When should my baby start crawling?",
        "How can I support speech development?",
        "How much milk do they still need?",
      );
    } else {
      base.push(
        "Tips for managing toddler tantrums?",
        "When should I start potty training?",
        "How do I encourage two-word phrases?",
        "Healthy snack ideas for a picky eater?",
      );
    }

    // Concern-aware prompts
    const concernPrompts: Record<string, string[]> = {
      Sleep: ["Help us build a calmer bedtime routine.", "How do I handle short naps?"],
      Feeding: ["Is my baby getting enough?", "Tips for a fussy eater."],
      Crying: ["Gentle ways to soothe a crying baby.", "Could this be colic?"],
      Development: ["What milestones should I look for this month?"],
      Postpartum: ["I'm exhausted — how do I recover?", "How do I know if it's baby blues vs. PPD?"],
      "Mental load": ["Help me split parenting tasks fairly.", "I feel overwhelmed — what can I do today?"],
      Health: ["When is a fever worth a doctor visit?"],
      Routine: ["Suggest a simple daily rhythm for us."],
    };
    const extras = concerns.flatMap((c) => concernPrompts[c] ?? []).slice(0, 3);

    // De-dupe, cap at 6
    const all = Array.from(new Set([...extras, ...base])).slice(0, 6);
    return { prompts: all };
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: babies }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("babies").select("*").eq("user_id", userId).order("created_at"),
    ]);
    return { profile, babies: babies ?? [] };
  });

const OnboardSchema = z.object({
  parentName: z.string().trim().min(1).max(80),
  concerns: z.array(z.string().min(1).max(40)).max(8).default([]),
  baby: z.object({
    name: z.string().trim().min(1).max(60),
    isPregnancy: z.boolean(),
    birthDate: z.string().optional(),
    pregnancyDueDate: z.string().optional(),
  }),
});

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => OnboardSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error: pErr } = await supabase.from("profiles").upsert({
      id: userId,
      parent_name: data.parentName,
      concerns: data.concerns,
      onboarded: true,
    });
    if (pErr) throw new Error(pErr.message);

    const { error: bErr } = await supabase.from("babies").insert({
      user_id: userId,
      name: data.baby.name,
      is_pregnancy: data.baby.isPregnancy,
      birth_date: data.baby.birthDate || null,
      pregnancy_due_date: data.baby.pregnancyDueDate || null,
    });
    if (bErr) throw new Error(bErr.message);
    return { ok: true };
  });

const MilestoneSchema = z.object({
  babyId: z.string().uuid(),
  category: z.string().min(1).max(40),
  title: z.string().min(1).max(120),
  notes: z.string().max(500).optional(),
  valueNumeric: z.number().optional(),
  unit: z.string().max(10).optional(),
});

export const addMilestone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => MilestoneSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("milestones").insert({
      user_id: userId,
      baby_id: data.babyId,
      category: data.category,
      title: data.title,
      notes: data.notes,
      value_numeric: data.valueNumeric,
      unit: data.unit,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMilestones = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ babyId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await context.supabase
      .from("milestones")
      .select("*")
      .eq("user_id", userId)
      .eq("baby_id", data.babyId)
      .order("achieved_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { milestones: rows ?? [] };
  });

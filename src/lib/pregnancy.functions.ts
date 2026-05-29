import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";


/* ---------- Appointments / reminders ---------- */

const ApptSchema = z.object({
  title: z.string().trim().min(1).max(120),
  notes: z.string().trim().max(500).optional(),
  kind: z.enum(["appointment", "scan", "supplement", "hydration", "other", "kick", "exercise"]).default("appointment"),
  scheduledAt: z.string().min(1),
  reminderMinutes: z.number().int().min(0).max(10080).optional(),
  recurrence: z.enum(["none", "daily", "weekly", "hourly"]).default("none"),
  notify: z.boolean().default(true),
});


export const listAppointments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("antenatal_appointments")
      .select("*")
      .eq("user_id", userId)
      .order("scheduled_at", { ascending: true });
    if (error) throw new Error(error.message);
    return { appointments: data ?? [] };
  });

export const addAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ApptSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("antenatal_appointments").insert({
      user_id: userId,
      title: data.title,
      notes: data.notes,
      kind: data.kind,
      scheduled_at: data.scheduledAt,
      reminder_minutes: data.reminderMinutes ?? 60,
      recurrence: data.recurrence,
      notify: data.notify,
    });

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleAppointmentDone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid(), done: z.boolean() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("antenatal_appointments")
      .update({ done: data.done, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("antenatal_appointments")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- Pregnancy logs (mood / symptom / kicks / contractions / sleep / weight) ---------- */

const LogKind = z.enum(["mood", "symptom", "kick_session", "contraction_session", "sleep", "weight"]);

const LogSchema = z.object({
  kind: LogKind,
  data: z.record(z.string(), z.any()).default({}),
  loggedAt: z.string().optional(),
});

export const addPregnancyLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => LogSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("pregnancy_logs").insert({
      user_id: context.userId,
      kind: data.kind,
      data: data.data,
      logged_at: data.loggedAt ?? new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listPregnancyLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ kind: LogKind.optional(), limit: z.number().int().min(1).max(200).default(50) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("pregnancy_logs")
      .select("*")
      .eq("user_id", context.userId)
      .order("logged_at", { ascending: false })
      .limit(data.limit);
    if (data.kind) q = q.eq("kind", data.kind);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { logs: rows ?? [] };
  });

/* ---------- Hospital bag ---------- */

const DEFAULT_BAG = [
  { label: "ID & insurance card", category: "documents" },
  { label: "Birth plan copy", category: "documents" },
  { label: "Toiletries", category: "mom" },
  { label: "Comfortable robe", category: "mom" },
  { label: "Nursing bra", category: "mom" },
  { label: "Phone charger (long cable)", category: "mom" },
  { label: "Going-home outfit", category: "mom" },
  { label: "Slippers & warm socks", category: "mom" },
  { label: "Baby coming-home outfit", category: "baby" },
  { label: "Newborn diapers", category: "baby" },
  { label: "Swaddle blanket", category: "baby" },
  { label: "Car seat (installed)", category: "baby" },
  { label: "Partner snacks", category: "partner" },
  { label: "Partner change of clothes", category: "partner" },
];

export const listBagItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    let { data } = await supabase
      .from("hospital_bag_items")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (!data || data.length === 0) {
      const seeded = DEFAULT_BAG.map((i) => ({ user_id: userId, label: i.label, category: i.category }));
      await supabase.from("hospital_bag_items").insert(seeded);
      const { data: again } = await supabase
        .from("hospital_bag_items")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      data = again ?? [];
    }
    return { items: data };
  });

export const toggleBagItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid(), packed: z.boolean() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("hospital_bag_items")
      .update({ packed: data.packed })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const addBagItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      label: z.string().trim().min(1).max(80),
      category: z.enum(["mom", "baby", "partner", "documents"]).default("mom"),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("hospital_bag_items").insert({
      user_id: context.userId,
      label: data.label,
      category: data.category,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteBagItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("hospital_bag_items")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- Birth plan ---------- */

export const getBirthPlan = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("birth_plans")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    return { plan: data };
  });

export const saveBirthPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ preferences: z.record(z.string(), z.any()) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("birth_plans").upsert(
      {
        user_id: context.userId,
        preferences: data.preferences,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- Birth plan sharing ---------- */

function genToken() {
  const a = new Uint8Array(18);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 24);
}

export const generateBirthPlanShare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const token = genToken();
    const { error } = await context.supabase.from("birth_plans").upsert(
      {
        user_id: context.userId,
        share_token: token,
        shared_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { token };
  });

export const revokeBirthPlanShare = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("birth_plans")
      .update({ share_token: null, shared_at: null, updated_at: new Date().toISOString() })
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getSharedBirthPlan = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ token: z.string().min(8).max(64) }).parse(i))
  .handler(async ({ data }) => {
    const { data: plan } = await supabaseAdmin
      .from("birth_plans")
      .select("preferences, updated_at, user_id")
      .eq("share_token", data.token)
      .maybeSingle();
    if (!plan) return { plan: null, parentName: null, dueDate: null };
    const { data: prof } = await supabaseAdmin
      .from("profiles").select("parent_name").eq("id", plan.user_id).maybeSingle();
    const { data: babies } = await supabaseAdmin
      .from("babies").select("pregnancy_due_date").eq("user_id", plan.user_id).limit(1);
    return {
      plan: { preferences: plan.preferences, updated_at: plan.updated_at },
      parentName: prof?.parent_name ?? null,
      dueDate: babies?.[0]?.pregnancy_due_date ?? null,
    };
  });


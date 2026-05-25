import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function publicClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
  });
}

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Admin only");
}

// --- ROLES ---
export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    return { roles: (data ?? []).map((r: any) => r.role as string) };
  });

// --- EXPERT APPLICATION ---
const ApplySchema = z.object({
  full_name: z.string().min(2).max(120),
  title: z.string().min(2).max(120),
  bio: z.string().min(20).max(2000),
  credentials: z.string().min(5).max(2000),
  specialties: z.array(z.string().min(1).max(60)).max(8).default([]),
});

export const applyAsExpert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ApplySchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("expert_applications")
      .upsert({ ...data, user_id: userId, status: "pending" }, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMyApplication = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase.from("expert_applications").select("*").eq("user_id", userId).maybeSingle();
    return { application: data };
  });

// --- PUBLIC EXPERT DIRECTORY ---
export const listExperts = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data } = await sb.from("expert_profiles").select("*").order("created_at", { ascending: false });
  return { experts: data ?? [] };
});

// --- ADMIN: LIST PENDING APPLICATIONS ---
export const adminListApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data } = await supabase
      .from("expert_applications")
      .select("*")
      .order("created_at", { ascending: false });
    return { applications: data ?? [] };
  });

const ReviewSchema = z.object({
  applicationId: z.string().uuid(),
  decision: z.enum(["approved", "rejected"]),
  notes: z.string().max(2000).optional(),
});

export const adminReviewApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ReviewSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data: app, error: appErr } = await supabase
      .from("expert_applications")
      .update({ status: data.decision, review_notes: data.notes ?? null })
      .eq("id", data.applicationId)
      .select("*")
      .single();
    if (appErr) throw new Error(appErr.message);

    if (data.decision === "approved") {
      await supabase.from("user_roles").upsert({ user_id: app.user_id, role: "expert" }, { onConflict: "user_id,role" });
      await supabase.from("expert_profiles").upsert(
        {
          user_id: app.user_id,
          display_name: app.full_name,
          title: app.title,
          bio: app.bio,
          specialties: app.specialties,
          verified: true,
        },
        { onConflict: "user_id" },
      );
      await supabase.from("notifications").insert({
        user_id: app.user_id,
        kind: "expert_approved",
        title: "You're a verified Nurtura expert!",
        body: "Your application was approved. You can now publish articles and reels.",
      });
    } else {
      await supabase.from("notifications").insert({
        user_id: app.user_id,
        kind: "expert_rejected",
        title: "Update on your expert application",
        body: data.notes ?? "Thanks for applying. We're not able to approve at this time.",
      });
    }
    return { ok: true };
  });

// --- ADMIN: MODERATION QUEUE ---
export const adminModerationQueue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const [articles, reels, posts, comments] = await Promise.all([
      supabase.from("articles").select("id,title,excerpt,category,moderation_status,created_at").neq("moderation_status", "approved").order("created_at", { ascending: false }),
      supabase.from("reels").select("id,title,description,category,moderation_status,created_at").neq("moderation_status", "approved").order("created_at", { ascending: false }),
      supabase.from("community_posts").select("id,title,body,moderation_status,created_at").neq("moderation_status", "approved").order("created_at", { ascending: false }),
      supabase.from("post_comments").select("id,body,moderation_status,created_at").neq("moderation_status", "approved").order("created_at", { ascending: false }),
    ]);
    return {
      articles: articles.data ?? [],
      reels: reels.data ?? [],
      posts: posts.data ?? [],
      comments: comments.data ?? [],
    };
  });

const ModerateSchema = z.object({
  table: z.enum(["articles", "reels", "community_posts", "post_comments"]),
  id: z.string().uuid(),
  status: z.enum(["approved", "rejected", "hidden"]),
});

export const adminSetModeration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ModerateSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { error } = await supabase.from(data.table).update({ moderation_status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// --- EXPERT: SUBMIT CONTENT ---
const SubmitArticleSchema = z.object({
  slug: z.string().min(2).max(120).regex(/^[a-z0-9-]+$/),
  title: z.string().min(3).max(200),
  excerpt: z.string().max(400).optional(),
  body: z.string().min(50).max(20000),
  category: z.string().min(2).max(60),
  read_minutes: z.number().int().min(1).max(60).optional(),
});

export const expertSubmitArticle = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SubmitArticleSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("articles").insert({
      ...data,
      author_id: userId,
      moderation_status: "pending",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const SubmitReelSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().max(600).optional(),
  category: z.string().min(2).max(60),
  duration_seconds: z.number().int().min(5).max(300).optional(),
  expert_name: z.string().max(120).optional(),
});

export const expertSubmitReel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => SubmitReelSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("reels").insert({
      ...data,
      author_id: userId,
      moderation_status: "pending",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const expertMySubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [articles, reels] = await Promise.all([
      supabase.from("articles").select("id,title,moderation_status,created_at").eq("author_id", userId).order("created_at", { ascending: false }),
      supabase.from("reels").select("id,title,moderation_status,created_at").eq("author_id", userId).order("created_at", { ascending: false }),
    ]);
    return { articles: articles.data ?? [], reels: reels.data ?? [] };
  });

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function publicClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false },
  });
}

// REELS
export const listReels = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data } = await sb.from("reels").select("*").order("created_at", { ascending: false }).limit(50);
  return { reels: data ?? [] };
});

export const toggleReelLike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ reelId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("reel_likes").select("id").eq("reel_id", data.reelId).eq("user_id", userId).maybeSingle();
    if (existing) {
      await supabase.from("reel_likes").delete().eq("id", existing.id);
      return { liked: false };
    }
    await supabase.from("reel_likes").insert({ reel_id: data.reelId, user_id: userId });
    return { liked: true };
  });

// GROUPS
export const listGroups = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data } = await sb.from("community_groups").select("*").order("name");
  return { groups: data ?? [] };
});

export const getGroup = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ slug: z.string().min(1).max(80) }).parse(i))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: group } = await sb.from("community_groups").select("*").eq("slug", data.slug).maybeSingle();
    if (!group) return { group: null, posts: [] };
    const { data: posts } = await sb
      .from("community_posts")
      .select("id,title,body,anonymous,author_name,likes_count,comments_count,created_at")
      .eq("group_id", group.id)
      .order("created_at", { ascending: false })
      .limit(50);
    return { group, posts: posts ?? [] };
  });

export const joinGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ groupId: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await supabase.from("group_members").insert({ group_id: data.groupId, user_id: userId });
    return { ok: true };
  });

// POSTS
const PostSchema = z.object({
  groupId: z.string().uuid(),
  title: z.string().min(2).max(160),
  body: z.string().min(2).max(4000),
  anonymous: z.boolean().default(false),
});

export const createPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => PostSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: prof } = await supabase.from("profiles").select("parent_name").eq("id", userId).maybeSingle();
    const { data: post, error } = await supabase
      .from("community_posts")
      .insert({
        group_id: data.groupId,
        user_id: userId,
        title: data.title,
        body: data.body,
        anonymous: data.anonymous,
        author_name: data.anonymous ? null : prof?.parent_name ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: post.id };
  });

// NOTIFICATIONS
export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return { notifications: data ?? [] };
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
    return { ok: true };
  });

// SEARCH (AI-suggested + content)
const SearchSchema = z.object({ q: z.string().min(1).max(200) });

export const searchEverything = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => SearchSchema.parse(i))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const term = `%${data.q}%`;
    const [articles, topics, reels, groups] = await Promise.all([
      sb.from("articles").select("slug,title,excerpt,category").or(`title.ilike.${term},excerpt.ilike.${term}`).limit(10),
      sb.from("is_this_normal_topics").select("slug,title,summary").or(`title.ilike.${term},summary.ilike.${term}`).limit(10),
      sb.from("reels").select("id,title,description,category").or(`title.ilike.${term},description.ilike.${term}`).limit(10),
      sb.from("community_groups").select("slug,name,description").or(`name.ilike.${term},description.ilike.${term}`).limit(10),
    ]);

    let aiSuggestions: string[] = [];
    const apiKey = process.env.LOVABLE_API_KEY;
    if (apiKey) {
      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: "You suggest 3 short related parenting questions a user might also ask. Return ONLY a JSON array of strings, no prose." },
              { role: "user", content: data.q },
            ],
          }),
        });
        if (res.ok) {
          const j = await res.json();
          const txt: string = j.choices?.[0]?.message?.content ?? "[]";
          const match = txt.match(/\[[\s\S]*\]/);
          if (match) aiSuggestions = JSON.parse(match[0]).slice(0, 3);
        }
      } catch {}
    }

    return {
      articles: articles.data ?? [],
      topics: topics.data ?? [],
      reels: reels.data ?? [],
      groups: groups.data ?? [],
      aiSuggestions,
    };
  });

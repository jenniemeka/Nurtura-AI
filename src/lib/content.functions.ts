import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

function publicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

export const listArticles = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data } = await sb.from("articles").select("id,slug,title,excerpt,category,read_minutes").order("created_at", { ascending: false });
  return { articles: data ?? [] };
});

export const getArticle = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ slug: z.string().min(1).max(120) }).parse(i))
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: row } = await sb.from("articles").select("*").eq("slug", data.slug).maybeSingle();
    return { article: row };
  });

export const listTopics = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data } = await sb.from("is_this_normal_topics").select("*").order("title");
  return { topics: data ?? [] };
});

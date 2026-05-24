import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { listArticles, listTopics } from "@/lib/content.functions";

export const Route = createFileRoute("/_app/learn")({
  head: () => ({ meta: [{ title: "Learn — Nurtura" }] }),
  component: Learn,
});

function Learn() {
  const fetchArticles = useServerFn(listArticles);
  const fetchTopics = useServerFn(listTopics);
  const { data: a } = useQuery({ queryKey: ["articles"], queryFn: () => fetchArticles() });
  const { data: t } = useQuery({ queryKey: ["topics"], queryFn: () => fetchTopics() });
  const [q, setQ] = useState("");

  const articles = (a?.articles ?? []).filter((x) => x.title.toLowerCase().includes(q.toLowerCase()));
  const topics = (t?.topics ?? []).filter((x) => x.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.15em] text-ink/40">Learn</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Trusted parenting guidance</h1>
      </div>

      <div className="flex items-center gap-2 rounded-full bg-card px-4 py-2.5 ring-1 ring-zinc-950/10">
        <Search className="size-4 text-ink/40" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search topics, articles…" className="flex-1 bg-transparent text-sm outline-none" />
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-ink/50 mb-3">Is this normal?</h2>
        <div className="grid grid-cols-2 gap-3">
          {topics.map((tp) => (
            <Link key={tp.id} to="/learn/$slug" params={{ slug: tp.slug }} className="rounded-2xl bg-lavender/40 p-4 ring-1 ring-zinc-950/5">
              <p className="font-medium text-sm">{tp.title}</p>
              <p className="text-xs text-ink/60 mt-1 line-clamp-2">{tp.summary}</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-ink/50 mb-3">Articles</h2>
        <div className="space-y-3">
          {articles.map((art) => (
            <Link key={art.id} to="/learn/$slug" params={{ slug: art.slug }} className="block rounded-2xl bg-card p-5 ring-1 ring-zinc-950/5">
              <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">{art.category} • {art.read_minutes} min</p>
              <p className="mt-1 font-medium">{art.title}</p>
              {art.excerpt && <p className="text-sm text-ink/60 mt-1">{art.excerpt}</p>}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

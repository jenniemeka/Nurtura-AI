import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { getArticle, listTopics } from "@/lib/content.functions";

export const Route = createFileRoute("/_app/learn/$slug")({
  head: ({ params }) => ({ meta: [{ title: `${params.slug.replace(/-/g, " ")} — Nurtura` }] }),
  component: Detail,
});

function Detail() {
  const { slug } = Route.useParams();
  const fetchArticle = useServerFn(getArticle);
  const fetchTopics = useServerFn(listTopics);

  const { data: a } = useQuery({ queryKey: ["article", slug], queryFn: () => fetchArticle({ data: { slug } }) });
  const { data: t } = useQuery({ queryKey: ["topics"], queryFn: () => fetchTopics() });

  const article = a?.article;
  const topic = t?.topics?.find((x) => x.slug === slug);

  return (
    <div className="space-y-5">
      <Link to="/learn" className="inline-flex items-center gap-1 text-sm text-ink/60"><ArrowLeft className="size-4" /> Back</Link>

      {article && (
        <article className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-ink/40">{article.category} • {article.read_minutes} min read</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{article.title}</h1>
          </div>
          <div className="prose prose-sm max-w-none text-ink/80 leading-relaxed whitespace-pre-wrap">{article.body}</div>
        </article>
      )}

      {topic && (
        <article className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-ink/40">Is this normal?</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">{topic.title}</h1>
            <p className="mt-2 text-ink/70">{topic.summary}</p>
          </div>
          <Section title="Common signs" items={topic.symptoms} color="bg-sky/40" />
          <Section title="Safe tips" items={topic.safe_tips} color="bg-sage/50" />
          <Section title="Warning signs" items={topic.warning_signs} color="bg-amber-100/60" />
          <div className="rounded-2xl bg-lavender/50 p-5 ring-1 ring-zinc-950/5">
            <p className="text-xs uppercase tracking-[0.15em] text-ink/50 mb-2">When to see a doctor</p>
            <p className="text-sm text-pretty">{topic.when_to_see_doctor}</p>
          </div>
        </article>
      )}

      {!article && !topic && <p className="text-sm text-ink/50">Loading…</p>}
    </div>
  );
}

function Section({ title, items, color }: { title: string; items: string[] | null; color: string }) {
  if (!items || items.length === 0) return null;
  return (
    <div className={`rounded-2xl ${color} p-5 ring-1 ring-zinc-950/5`}>
      <p className="text-xs uppercase tracking-[0.15em] text-ink/50 mb-2">{title}</p>
      <ul className="space-y-1.5 text-sm">
        {items.map((i, idx) => <li key={idx} className="flex gap-2"><span className="text-ink/40">•</span><span>{i}</span></li>)}
      </ul>
    </div>
  );
}

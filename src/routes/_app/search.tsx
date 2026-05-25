import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { searchEverything } from "@/lib/community.functions";

export const Route = createFileRoute("/_app/search")({
  head: () => ({ meta: [{ title: "Search — Nurtura" }] }),
  component: SearchPage,
});

function SearchPage() {
  const fn = useServerFn(searchEverything);
  const [q, setQ] = useState("");
  const m = useMutation({ mutationFn: (term: string) => fn({ data: { q: term } }) });
  const r = m.data;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim().length >= 2) m.mutate(q.trim());
  };

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-[0.15em] text-ink/40">Find</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Search everything</h1>
      </header>

      <form onSubmit={submit} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-ink/40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Try: sleep regression, latch, fever…"
          className="w-full bg-white rounded-full pl-11 pr-4 py-3 text-sm ring-1 ring-zinc-950/5 outline-none focus:ring-ink/20"
          autoFocus
        />
      </form>

      {m.isPending && <p className="text-sm text-ink/40">Searching…</p>}

      {r && (
        <div className="space-y-6">
          {r.aiSuggestions?.length > 0 && (
            <section>
              <h2 className="text-xs uppercase tracking-wider text-ink/40 mb-2 flex items-center gap-1">
                <Sparkles className="size-3" /> AI suggestions
              </h2>
              <div className="flex flex-wrap gap-2">
                {r.aiSuggestions.map((s: string) => (
                  <button key={s} onClick={() => { setQ(s); m.mutate(s); }}
                    className="rounded-full bg-lavender text-ink px-3 py-1.5 text-xs">
                    {s}
                  </button>
                ))}
              </div>
            </section>
          )}

          <Section title="Articles" empty={!r.articles.length}>
            {r.articles.map((a: any) => (
              <Link key={a.slug} to="/learn/$slug" params={{ slug: a.slug }} className="block rounded-2xl bg-white p-4 ring-1 ring-zinc-950/5">
                <p className="text-[10px] uppercase tracking-wider text-ink/40">{a.category}</p>
                <p className="text-sm font-medium mt-0.5">{a.title}</p>
                {a.excerpt && <p className="text-xs text-ink/60 mt-1 line-clamp-2">{a.excerpt}</p>}
              </Link>
            ))}
          </Section>

          <Section title="Is this normal?" empty={!r.topics.length}>
            {r.topics.map((t: any) => (
              <div key={t.slug} className="rounded-2xl bg-white p-4 ring-1 ring-zinc-950/5">
                <p className="text-sm font-medium">{t.title}</p>
                <p className="text-xs text-ink/60 mt-1 line-clamp-2">{t.summary}</p>
              </div>
            ))}
          </Section>

          <Section title="Short lessons" empty={!r.reels.length}>
            {r.reels.map((x: any) => (
              <Link key={x.id} to="/reels" className="block rounded-2xl bg-white p-4 ring-1 ring-zinc-950/5">
                <p className="text-sm font-medium">{x.title}</p>
                {x.description && <p className="text-xs text-ink/60 mt-1 line-clamp-2">{x.description}</p>}
              </Link>
            ))}
          </Section>

          <Section title="Groups" empty={!r.groups.length}>
            {r.groups.map((g: any) => (
              <Link key={g.slug} to="/community/$slug" params={{ slug: g.slug }}
                className="block rounded-2xl bg-white p-4 ring-1 ring-zinc-950/5">
                <p className="text-sm font-medium">{g.name}</p>
                <p className="text-xs text-ink/60 mt-1 line-clamp-2">{g.description}</p>
              </Link>
            ))}
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ title, empty, children }: { title: string; empty: boolean; children: React.ReactNode }) {
  if (empty) return null;
  return (
    <section>
      <h2 className="text-xs uppercase tracking-wider text-ink/40 mb-2">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { listExperts } from "@/lib/expert.functions";

export const Route = createFileRoute("/_app/experts")({
  head: () => ({ meta: [{ title: "Experts — Nurtura" }] }),
  component: ExpertsPage,
});

function ExpertsPage() {
  const fn = useServerFn(listExperts);
  const { data } = useQuery({ queryKey: ["experts"], queryFn: () => fn() });
  const experts = data?.experts ?? [];
  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-[0.15em] text-ink/40">Trusted voices</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Verified experts</h1>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {experts.map((e: any) => (
          <article key={e.id} className="rounded-3xl bg-white p-5 ring-1 ring-zinc-950/5">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-gradient-to-br from-lavender to-sky" />
              <div className="flex-1">
                <p className="font-medium flex items-center gap-1">
                  {e.display_name}
                  {e.verified && <ShieldCheck className="size-3.5 text-sky-600 fill-sky-100" />}
                </p>
                <p className="text-xs text-ink/60">{e.title}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-ink/70 line-clamp-3">{e.bio}</p>
            {e.specialties?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {e.specialties.map((s: string) => (
                  <span key={s} className="text-[10px] rounded-full bg-cream px-2 py-0.5 text-ink/60">{s}</span>
                ))}
              </div>
            )}
          </article>
        ))}
        {!experts.length && <p className="text-sm text-ink/40">No verified experts yet.</p>}
      </div>
    </div>
  );
}

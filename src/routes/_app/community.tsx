import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Users, ArrowRight } from "lucide-react";
import { listGroups } from "@/lib/community.functions";

export const Route = createFileRoute("/_app/community")({
  head: () => ({ meta: [{ title: "Community — Nurtura" }] }),
  component: CommunityPage,
});

function CommunityPage() {
  const fetchGroups = useServerFn(listGroups);
  const { data } = useQuery({ queryKey: ["groups"], queryFn: () => fetchGroups() });
  const groups = data?.groups ?? [];

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-[0.15em] text-ink/40">Together</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Parent community</h1>
        <p className="mt-1 text-sm text-ink/60">Safe spaces to ask and share. Post anonymously anytime.</p>
      </header>

      <div className="space-y-3">
        {groups.map((g: any) => (
          <Link
            key={g.id}
            to="/community/$slug"
            params={{ slug: g.slug }}
            className="block rounded-3xl bg-white p-5 ring-1 ring-zinc-950/5 hover:ring-zinc-950/10 transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-medium">{g.name}</h3>
                <p className="mt-1 text-sm text-ink/60 line-clamp-2">{g.description}</p>
                <p className="mt-2 text-[11px] text-ink/40 flex items-center gap-1">
                  <Users className="size-3" /> {g.member_count} parents
                </p>
              </div>
              <ArrowRight className="size-4 text-ink/30 mt-1" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

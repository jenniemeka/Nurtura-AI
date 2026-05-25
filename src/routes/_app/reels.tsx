import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Heart, Play, Clock } from "lucide-react";
import { listReels, toggleReelLike } from "@/lib/community.functions";

export const Route = createFileRoute("/_app/reels")({
  head: () => ({ meta: [{ title: "Reels — Nurtura" }] }),
  component: ReelsPage,
});

function ReelsPage() {
  const fetchReels = useServerFn(listReels);
  const { data } = useQuery({ queryKey: ["reels"], queryFn: () => fetchReels() });
  const reels = data?.reels ?? [];

  return (
    <div className="space-y-4">
      <header>
        <p className="text-xs uppercase tracking-[0.15em] text-ink/40">Watch</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Short lessons</h1>
        <p className="mt-1 text-sm text-ink/60">60-second guidance from pediatric experts.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {reels.map((r: any) => <ReelCard key={r.id} reel={r} />)}
        {!reels.length && <p className="text-sm text-ink/40">No reels yet.</p>}
      </div>
    </div>
  );
}

function ReelCard({ reel }: { reel: any }) {
  const qc = useQueryClient();
  const like = useServerFn(toggleReelLike);
  const [liked, setLiked] = useState(false);
  const m = useMutation({
    mutationFn: () => like({ data: { reelId: reel.id } }),
    onSuccess: (res) => { setLiked(res.liked); qc.invalidateQueries({ queryKey: ["reels"] }); },
  });

  const gradients = ["from-lavender to-sky", "from-sky to-sage", "from-sage to-lavender", "from-cream to-lavender"];
  const g = gradients[reel.title.length % gradients.length];

  return (
    <article className="overflow-hidden rounded-3xl bg-white ring-1 ring-zinc-950/5 shadow-sm">
      <div className={`relative aspect-[3/4] bg-gradient-to-br ${g} grid place-items-center`}>
        <div className="size-14 rounded-full bg-white/80 backdrop-blur grid place-items-center">
          <Play className="size-6 text-ink fill-ink" />
        </div>
        <span className="absolute top-3 left-3 rounded-full bg-white/80 backdrop-blur px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider">
          {reel.category}
        </span>
        <span className="absolute top-3 right-3 rounded-full bg-ink/70 text-white px-2 py-1 text-[10px] flex items-center gap-1">
          <Clock className="size-3" /> {reel.duration_seconds}s
        </span>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-medium leading-snug text-balance">{reel.title}</h3>
        {reel.description && <p className="text-xs text-ink/60 line-clamp-2">{reel.description}</p>}
        <div className="flex items-center justify-between pt-1">
          <p className="text-[11px] text-ink/50">{reel.expert_name}</p>
          <button onClick={() => m.mutate()} className="flex items-center gap-1 text-xs text-ink/60 hover:text-ink">
            <Heart className={`size-4 ${liked ? "fill-rose-500 text-rose-500" : ""}`} />
            {reel.likes_count + (liked ? 1 : 0)}
          </button>
        </div>
      </div>
    </article>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, Volume2, VolumeX, Pause } from "lucide-react";
import { listReels, toggleReelLike } from "@/lib/community.functions";

export const Route = createFileRoute("/_app/reels")({
  head: () => ({ meta: [{ title: "Reels — Nurtura" }] }),
  component: ReelsPage,
});

const CATEGORIES = ["All", "sleep", "feeding", "development", "soothing", "health"] as const;

function ReelsPage() {
  const fetchReels = useServerFn(listReels);
  const { data } = useQuery({ queryKey: ["reels"], queryFn: () => fetchReels() });
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [muted, setMuted] = useState(true);

  const reels = useMemo(() => {
    const all = data?.reels ?? [];
    return category === "All" ? all : all.filter((r: any) => r.category === category);
  }, [data, category]);

  return (
    <div className="-mx-5 -mt-2">
      {/* Sticky category bar */}
      <div className="sticky top-0 z-20 bg-cream/85 backdrop-blur px-5 pt-2 pb-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-ink/40">Watch</p>
            <h1 className="text-2xl font-semibold tracking-tight">Short lessons</h1>
          </div>
          <button
            onClick={() => setMuted((m) => !m)}
            className="size-9 grid place-items-center rounded-full bg-card ring-1 ring-zinc-950/10"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs capitalize ring-1 transition ${
                category === c ? "bg-ink text-cream ring-ink" : "bg-card text-ink/70 ring-zinc-950/10"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Vertical snap feed */}
      <div className="h-[calc(100vh-220px)] overflow-y-auto snap-y snap-mandatory no-scrollbar">
        {reels.map((r: any) => (
          <ReelItem key={r.id} reel={r} muted={muted} />
        ))}
        {!reels.length && (
          <div className="h-full grid place-items-center px-8 text-center text-sm text-ink/50">
            No lessons in this category yet.
          </div>
        )}
      </div>
    </div>
  );
}

function ReelItem({ reel, muted }: { reel: any; muted: boolean }) {
  const qc = useQueryClient();
  const like = useServerFn(toggleReelLike);
  const [liked, setLiked] = useState(false);
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const m = useMutation({
    mutationFn: () => like({ data: { reelId: reel.id } }),
    onSuccess: (res) => { setLiked(res.liked); qc.invalidateQueries({ queryKey: ["reels"] }); },
  });

  // Autoplay when scrolled into view
  useEffect(() => {
    const el = containerRef.current;
    const v = videoRef.current;
    if (!el || !v) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio > 0.7) {
            v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
          } else {
            v.pause();
            setPlaying(false);
          }
        });
      },
      { threshold: [0, 0.7, 1] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().then(() => setPlaying(true)).catch(() => {});
    else { v.pause(); setPlaying(false); }
  }

  return (
    <div
      ref={containerRef}
      className="snap-start h-[calc(100vh-220px)] px-5 py-2"
    >
      <div className="relative h-full overflow-hidden rounded-3xl bg-ink ring-1 ring-zinc-950/10">
        <video
          ref={videoRef}
          src={reel.video_url || undefined}
          poster={reel.thumbnail_url || undefined}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          loop
          muted={muted}
          preload="metadata"
          onClick={togglePlay}
        />
        {/* Gradient overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-ink/30 pointer-events-none" />

        {/* Pause overlay */}
        {!playing && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 grid place-items-center"
            aria-label="Play"
          >
            <span className="size-16 rounded-full bg-white/85 grid place-items-center backdrop-blur">
              <Pause className="size-7 text-ink fill-ink rotate-90" />
            </span>
          </button>
        )}

        {/* Top: category */}
        <span className="absolute top-3 left-3 rounded-full bg-white/85 backdrop-blur px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-ink">
          {reel.category}
        </span>

        {/* Right rail actions */}
        <div className="absolute right-3 bottom-28 flex flex-col items-center gap-4 text-cream">
          <button onClick={() => m.mutate()} className="flex flex-col items-center gap-1">
            <span className={`size-11 grid place-items-center rounded-full bg-white/15 backdrop-blur ring-1 ring-white/20 ${liked ? "" : ""}`}>
              <Heart className={`size-5 ${liked ? "fill-rose-500 text-rose-500" : "text-white"}`} />
            </span>
            <span className="text-[11px] tabular-nums">{reel.likes_count + (liked ? 1 : 0)}</span>
          </button>
        </div>

        {/* Bottom caption */}
        <div className="absolute left-4 right-20 bottom-4 text-cream">
          <p className="text-[11px] uppercase tracking-[0.12em] opacity-80">{reel.expert_name ?? "Nurtura"}</p>
          <h3 className="mt-1 text-lg font-semibold leading-snug text-balance">{reel.title}</h3>
          {reel.description && <p className="mt-1 text-xs opacity-80 line-clamp-2">{reel.description}</p>}
        </div>
      </div>
    </div>
  );
}

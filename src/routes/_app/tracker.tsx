import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Award, Lock, Sparkles } from "lucide-react";
import { getMe, addMilestone, listMilestones } from "@/lib/profile.functions";

export const Route = createFileRoute("/_app/tracker")({
  head: () => ({ meta: [{ title: "Tracker — Nurtura" }] }),
  component: Tracker,
});

const CATEGORIES = ["Crawling", "Walking", "Talking", "Feeding", "Sleep", "Weight", "Height", "Vaccination"];

const BADGES = [
  { id: "first", label: "First step", emoji: "🌱", min: 1 },
  { id: "rolling", label: "Rolling along", emoji: "🌀", min: 3 },
  { id: "memory", label: "Memory keeper", emoji: "📔", min: 5 },
  { id: "rhythm", label: "Found a rhythm", emoji: "🎶", min: 10 },
  { id: "chronicler", label: "Family chronicler", emoji: "🏆", min: 25 },
];

function ageMonths(b?: { is_pregnancy?: boolean; birth_date?: string | null }) {
  if (!b || b.is_pregnancy || !b.birth_date) return null;
  return (Date.now() - new Date(b.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
}

function suggestionsForAge(m: number | null): { category: string; title: string }[] {
  if (m === null) return [{ category: "Health", title: "Prenatal checkup" }];
  if (m < 3) return [
    { category: "Feeding", title: "First good latch" },
    { category: "Sleep", title: "First 4-hour stretch" },
    { category: "Talking", title: "First social smile" },
  ];
  if (m < 6) return [
    { category: "Crawling", title: "Rolling tummy to back" },
    { category: "Feeding", title: "Showing interest in food" },
    { category: "Talking", title: "First belly laugh" },
  ];
  if (m < 12) return [
    { category: "Feeding", title: "First taste of solids" },
    { category: "Crawling", title: "Sitting unassisted" },
    { category: "Talking", title: "First babble: ba-ba/ma-ma" },
  ];
  if (m < 24) return [
    { category: "Walking", title: "First independent steps" },
    { category: "Talking", title: "First clear word" },
    { category: "Feeding", title: "Using a spoon" },
  ];
  return [
    { category: "Talking", title: "Two-word phrases" },
    { category: "Walking", title: "Running confidently" },
    { category: "Feeding", title: "Eats family meals" },
  ];
}

function Tracker() {
  const fetchMe = useServerFn(getMe);
  const fetchMs = useServerFn(listMilestones);
  const add = useServerFn(addMilestone);
  const qc = useQueryClient();

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => fetchMe() });
  const baby = me?.babies?.[0];
  const { data: ms } = useQuery({
    queryKey: ["milestones", baby?.id],
    queryFn: () => fetchMs({ data: { babyId: baby!.id } }),
    enabled: !!baby,
  });

  const months = useMemo(() => ageMonths(baby), [baby]);
  const suggestions = useMemo(() => suggestionsForAge(months), [months]);
  const milestoneCount = ms?.milestones.length ?? 0;

  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState(CATEGORIES[0]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  function openWith(prefill?: { category: string; title: string }) {
    if (prefill) {
      setCat(prefill.category);
      setTitle(prefill.title);
    }
    setOpen(true);
  }

  async function submit() {
    if (!baby || !title.trim()) return;
    try {
      await add({ data: { babyId: baby.id, category: cat, title, notes: notes || undefined } });
      setTitle(""); setNotes(""); setOpen(false);
      qc.invalidateQueries({ queryKey: ["milestones", baby.id] });
      toast.success("Milestone saved 🌱");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  // Group milestones by month for timeline
  const grouped = useMemo(() => {
    const items = ms?.milestones ?? [];
    const map = new Map<string, typeof items>();
    items.forEach((m) => {
      const d = new Date(m.achieved_at);
      const key = d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
      if (!map.has(key)) map.set(key, [] as typeof items);
      map.get(key)!.push(m);
    });
    return Array.from(map.entries());
  }, [ms]);

  const ageLabel = months === null
    ? (baby?.is_pregnancy ? "Pregnancy" : "—")
    : months < 1 ? "< 1 month"
    : months < 24 ? `${Math.round(months)} months`
    : `${(months / 12).toFixed(1)} years`;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-ink/40">Tracker</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{baby?.name ?? "Baby"}'s journey</h1>
          <p className="text-xs text-ink/50 mt-0.5">{ageLabel} · {milestoneCount} logged</p>
        </div>
        <button onClick={() => openWith()} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm text-cream">
          <Plus className="size-4" /> Log
        </button>
      </div>

      {/* Badges */}
      <section className="rounded-3xl bg-card p-4 ring-1 ring-zinc-950/5">
        <div className="flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] text-ink/50">
          <Award className="size-3.5" /> Badges
        </div>
        <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar">
          {BADGES.map((b) => {
            const unlocked = milestoneCount >= b.min;
            return (
              <div
                key={b.id}
                className={`shrink-0 w-24 text-center rounded-2xl p-3 ring-1 transition ${
                  unlocked ? "bg-lavender/60 ring-zinc-950/10" : "bg-cream ring-zinc-950/5 opacity-60"
                }`}
                title={unlocked ? `Unlocked at ${b.min} milestones` : `Unlock at ${b.min} milestones`}
              >
                <div className="text-2xl">{unlocked ? b.emoji : <Lock className="size-5 mx-auto text-ink/40" />}</div>
                <p className="mt-1 text-[11px] font-medium leading-tight">{b.label}</p>
                <p className="text-[10px] text-ink/50 mt-0.5">{b.min}+</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Suggested for age */}
      {!open && suggestions.length > 0 && (
        <section>
          <div className="flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] text-ink/50">
            <Sparkles className="size-3.5" /> Suggested for {ageLabel.toLowerCase()}
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s.title}
                onClick={() => openWith(s)}
                className="rounded-full bg-card px-3 py-1.5 text-xs ring-1 ring-zinc-950/10 hover:bg-lavender/40 transition"
              >
                + {s.title}
              </button>
            ))}
          </div>
        </section>
      )}

      {open && (
        <div className="rounded-3xl bg-card p-5 ring-1 ring-zinc-950/5 space-y-3">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`rounded-full px-3 py-1.5 text-xs ring-1 ${cat === c ? "bg-ink text-cream ring-ink" : "bg-cream ring-zinc-950/10"}`}>
                {c}
              </button>
            ))}
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (e.g. First word: mama)" className="w-full rounded-2xl bg-cream px-4 py-3 text-sm ring-1 ring-zinc-950/10 outline-none" maxLength={120} />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className="w-full rounded-2xl bg-cream px-4 py-3 text-sm ring-1 ring-zinc-950/10 outline-none" rows={3} maxLength={500} />
          <div className="flex gap-2">
            <button onClick={() => setOpen(false)} className="flex-1 rounded-full bg-cream px-4 py-2.5 text-sm ring-1 ring-zinc-950/10">Cancel</button>
            <button onClick={submit} className="flex-1 rounded-full bg-ink px-4 py-2.5 text-sm text-cream">Save</button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-5">
        {grouped.map(([month, items]) => (
          <div key={month}>
            <p className="text-[10px] uppercase tracking-[0.18em] text-ink/40 mb-2">{month}</p>
            <div className="relative pl-5 space-y-3 before:absolute before:left-1.5 before:top-1.5 before:bottom-1.5 before:w-px before:bg-zinc-950/10">
              {items.map((m) => (
                <div key={m.id} className="relative">
                  <span className="absolute -left-[18px] top-3 size-2.5 rounded-full bg-ink ring-4 ring-cream" />
                  <div className="rounded-2xl bg-card p-4 ring-1 ring-zinc-950/5">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">{m.category}</p>
                    <p className="mt-1 font-medium text-sm">{m.title}</p>
                    {m.notes && <p className="text-xs text-ink/60 mt-1">{m.notes}</p>}
                    <p className="text-[10px] text-ink/40 mt-2">{new Date(m.achieved_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {ms && ms.milestones.length === 0 && (
          <div className="rounded-2xl bg-lavender/40 p-6 text-center text-sm text-ink/60 ring-1 ring-zinc-950/5">
            No milestones logged yet. Every tiny step counts. 🌱
          </div>
        )}
      </div>
    </div>
  );
}

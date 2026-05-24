import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { getMe, addMilestone, listMilestones } from "@/lib/profile.functions";

export const Route = createFileRoute("/_app/tracker")({
  head: () => ({ meta: [{ title: "Tracker — Nurtura" }] }),
  component: Tracker,
});

const CATEGORIES = ["Crawling", "Walking", "Talking", "Feeding", "Sleep", "Weight", "Height", "Vaccination"];

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

  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState(CATEGORIES[0]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

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

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-ink/40">Tracker</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{baby?.name ?? "Baby"}'s journey</h1>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm text-cream">
          <Plus className="size-4" /> Log
        </button>
      </div>

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

      <div className="space-y-3">
        {(ms?.milestones ?? []).map((m) => (
          <div key={m.id} className="rounded-2xl bg-card p-4 ring-1 ring-zinc-950/5">
            <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">{m.category}</p>
            <p className="mt-1 font-medium text-sm">{m.title}</p>
            {m.notes && <p className="text-xs text-ink/60 mt-1">{m.notes}</p>}
            <p className="text-[10px] text-ink/40 mt-2">{new Date(m.achieved_at).toLocaleDateString()}</p>
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

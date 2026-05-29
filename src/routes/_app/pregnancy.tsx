import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import {
  Activity, Baby, BellRing, BookOpen, CalendarPlus, ClipboardList, Download, Droplet,
  Footprints, Heart, Link2, ListChecks, Moon, Plus, Scale, Share2, Smile, Sparkles, Stethoscope,
  Timer, Trash2,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { getMe } from "@/lib/profile.functions";
import {
  addAppointment, addBagItem, addPregnancyLog, deleteAppointment, deleteBagItem,
  generateBirthPlanShare, getBirthPlan, getSharedBirthPlan, listAppointments, listBagItems,
  listPregnancyLogs, revokeBirthPlanShare, saveBirthPlan, toggleAppointmentDone, toggleBagItem,
} from "@/lib/pregnancy.functions";


export const Route = createFileRoute("/_app/pregnancy")({
  head: () => ({ meta: [{ title: "Pregnancy — Nurtura" }] }),
  component: PregnancyHub,
});

type Tab = "overview" | "reminders" | "track" | "tools" | "plan";

function weeksFromDue(due?: string | null) {
  if (!due) return null;
  const ms = new Date(due).getTime() - Date.now();
  const daysLeft = Math.round(ms / 86400000);
  const week = Math.max(1, Math.min(40, 40 - Math.round(daysLeft / 7)));
  return { week, daysLeft, trimester: week < 14 ? 1 : week < 28 ? 2 : 3 };
}

const FRUIT_SIZE: Record<number, string> = {
  4: "poppy seed", 6: "lentil", 8: "raspberry", 10: "strawberry", 12: "lime",
  14: "lemon", 16: "avocado", 18: "bell pepper", 20: "banana", 22: "papaya",
  24: "ear of corn", 26: "lettuce", 28: "eggplant", 30: "cabbage", 32: "squash",
  34: "cantaloupe", 36: "honeydew", 38: "pumpkin", 40: "watermelon",
};
function fruitFor(week: number) {
  const keys = Object.keys(FRUIT_SIZE).map(Number).sort((a, b) => a - b);
  let pick = keys[0];
  for (const k of keys) if (k <= week) pick = k;
  return FRUIT_SIZE[pick];
}

/* Per-week milestones + growth insights */
const WEEK_INFO: Record<number, { milestone: string; insight: string; length?: string; weight?: string }> = {
  4: { milestone: "Implantation complete", insight: "Neural tube and heart begin forming.", length: "2 mm" },
  6: { milestone: "Heartbeat detectable", insight: "Tiny buds for arms and legs appear.", length: "5 mm" },
  8: { milestone: "All major organs forming", insight: "Fingers and toes start to separate.", length: "1.6 cm" },
  10: { milestone: "Vital organs functioning", insight: "Baby moves but you can't feel it yet.", length: "3 cm", weight: "4 g" },
  12: { milestone: "End of first trimester", insight: "Reflexes develop; miscarriage risk drops sharply.", length: "5 cm", weight: "14 g" },
  14: { milestone: "Facial expressions begin", insight: "Baby can squint, frown, and grimace.", length: "8 cm", weight: "40 g" },
  16: { milestone: "Sex may be visible on ultrasound", insight: "Tiny bones hardening; eyes can move.", length: "12 cm", weight: "100 g" },
  18: { milestone: "Hearing develops", insight: "Baby can hear your voice and heartbeat.", length: "14 cm", weight: "190 g" },
  20: { milestone: "Halfway there — anatomy scan", insight: "You may start feeling first kicks.", length: "25 cm", weight: "300 g" },
  22: { milestone: "Eyebrows and lashes form", insight: "Baby develops a sleep–wake rhythm.", length: "28 cm", weight: "430 g" },
  24: { milestone: "Viability milestone", insight: "Lungs make surfactant; taste buds form.", length: "30 cm", weight: "600 g" },
  26: { milestone: "Eyes open", insight: "Baby responds to sound and light.", length: "35 cm", weight: "760 g" },
  28: { milestone: "Third trimester begins", insight: "Start daily kick counts; brain growth accelerates.", length: "38 cm", weight: "1 kg" },
  30: { milestone: "Bone marrow makes blood cells", insight: "Baby's grip strengthens; eyesight sharpens.", length: "40 cm", weight: "1.3 kg" },
  32: { milestone: "Practicing breathing", insight: "Skin smoothing; fingernails reach fingertips.", length: "42 cm", weight: "1.7 kg" },
  34: { milestone: "Central nervous system maturing", insight: "Most babies turn head-down this month.", length: "45 cm", weight: "2.1 kg" },
  36: { milestone: "Early term soon", insight: "Lungs nearly mature; gaining ~225 g per week.", length: "47 cm", weight: "2.6 kg" },
  38: { milestone: "Full term", insight: "Vernix shedding; baby ready any day now.", length: "49 cm", weight: "3 kg" },
  40: { milestone: "Due date", insight: "Watch for contractions, water breaking, or bloody show.", length: "50 cm", weight: "3.4 kg" },
};
function weekInfoFor(week: number) {
  const keys = Object.keys(WEEK_INFO).map(Number).sort((a, b) => a - b);
  let pick = keys[0];
  for (const k of keys) if (k <= week) pick = k;
  return WEEK_INFO[pick];
}

function PregnancyHub() {
  const fetchMe = useServerFn(getMe);
  const nav = useNavigate();
  const { data: me, isLoading } = useQuery({ queryKey: ["me"], queryFn: () => fetchMe() });
  const baby = me?.babies?.[0];
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (!isLoading && baby && !baby.is_pregnancy) {
      // Not in pregnancy mode — bounce to dashboard
      nav({ to: "/dashboard" });
    }
  }, [isLoading, baby, nav]);

  const w = useMemo(() => weeksFromDue(baby?.pregnancy_due_date), [baby?.pregnancy_due_date]);

  if (isLoading || !baby) return <p className="text-sm text-ink/50">Loading…</p>;

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-[0.15em] text-ink/40">Pregnancy Mode</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{baby.name}'s journey</h1>
        {w && (
          <p className="text-xs text-ink/60 mt-0.5">
            Week {w.week} · trimester {w.trimester} · {w.daysLeft > 0 ? `${w.daysLeft} days to go` : "any day now"}
          </p>
        )}
      </header>

      <div className="sticky top-14 z-10 -mx-5 px-5 pb-2 pt-1 bg-cream/85 backdrop-blur">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {([
            ["overview", "Overview"], ["reminders", "Reminders"],
            ["track", "Tracking"], ["tools", "Tools"], ["plan", "Birth plan"],
          ] as [Tab, string][]).map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs ring-1 transition ${
                tab === k ? "bg-ink text-cream ring-ink" : "bg-card text-ink/70 ring-zinc-950/10"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {tab === "overview" && <Overview week={w?.week ?? null} trimester={w?.trimester ?? null} />}
      {tab === "reminders" && <Reminders />}
      {tab === "track" && <TrackingPanel />}
      {tab === "tools" && <Tools />}
      {tab === "plan" && <BirthPlanPanel />}
    </div>
  );
}

/* ---------- Overview ---------- */

function Overview({ week, trimester }: { week: number | null; trimester: number | null }) {
  const pct = week ? Math.min(100, Math.round((week / 40) * 100)) : 0;
  const fruit = week ? fruitFor(week) : null;
  const info = week ? weekInfoFor(week) : null;
  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-lavender/60 p-5 ring-1 ring-zinc-950/5">
        <p className="text-xs uppercase tracking-[0.15em] text-ink/50">Weekly progress</p>
        <p className="mt-2 text-base text-pretty">
          {week ? <>You're in <span className="font-semibold">week {week}</span>. Baby is about the size of a {fruit}.</> : "Add a due date to see weekly insights."}
        </p>
        <div className="mt-4 h-2 rounded-full bg-cream overflow-hidden">
          <div className="h-full bg-ink" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 text-[10px] tracking-wider text-ink/40">{pct}% of 40 weeks</p>
      </section>

      {info && (
        <section className="rounded-3xl bg-card p-5 ring-1 ring-zinc-950/5">
          <p className="text-xs uppercase tracking-[0.15em] text-ink/40">This week's milestone</p>
          <p className="mt-2 text-base font-medium">{info.milestone}</p>
          <p className="mt-1 text-sm text-ink/70">{info.insight}</p>
          {(info.length || info.weight) && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {info.length && (
                <div className="rounded-2xl bg-cream p-3 ring-1 ring-zinc-950/10">
                  <p className="text-[10px] uppercase tracking-wider text-ink/50">Length</p>
                  <p className="mt-0.5 text-sm font-semibold">{info.length}</p>
                </div>
              )}
              {info.weight && (
                <div className="rounded-2xl bg-cream p-3 ring-1 ring-zinc-950/10">
                  <p className="text-[10px] uppercase tracking-wider text-ink/50">Weight</p>
                  <p className="mt-0.5 text-sm font-semibold">{info.weight}</p>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      <section className="grid grid-cols-2 gap-3">
        <Link to="/ai" className="rounded-2xl bg-card p-4 ring-1 ring-zinc-950/5">
          <Stethoscope className="size-5 text-ink/70" />
          <p className="mt-2 font-medium text-sm">Ask Nurtura AI</p>
          <p className="text-xs text-ink/50 mt-0.5">Pregnancy-safe answers.</p>
        </Link>
        <Link to="/reels" className="rounded-2xl bg-card p-4 ring-1 ring-zinc-950/5">
          <BookOpen className="size-5 text-ink/70" />
          <p className="mt-2 font-medium text-sm">Antenatal videos</p>
          <p className="text-xs text-ink/50 mt-0.5">Care, nutrition, exercises.</p>
        </Link>
      </section>

      <section className="rounded-3xl bg-card p-5 ring-1 ring-zinc-950/5">
        <p className="text-xs uppercase tracking-[0.15em] text-ink/40">This trimester</p>
        <ul className="mt-2 space-y-2 text-sm text-ink/80 list-disc pl-5">
          {trimester === 1 && (<>
            <li>Take prenatal vitamins with folate daily.</li>
            <li>First-trimester scan (10–13 weeks) and bloods.</li>
            <li>Rest often — fatigue and nausea are common.</li>
          </>)}
          {trimester === 2 && (<>
            <li>Anatomy scan around 20 weeks.</li>
            <li>Start gentle prenatal exercises and pelvic floor work.</li>
            <li>Watch for first kicks (around 18–22 weeks).</li>
          </>)}
          {trimester === 3 && (<>
            <li>Daily kick counts after 28 weeks.</li>
            <li>Pack your hospital bag, finalize birth plan.</li>
            <li>Watch for: heavy bleeding, severe headache, reduced movement — call your provider.</li>
          </>)}
          {trimester === null && <li>Add a due date in your profile to personalize this.</li>}
        </ul>
      </section>
    </div>
  );
}

/* ---------- Reminders ---------- */

function Reminders() {
  const list = useServerFn(listAppointments);
  const add = useServerFn(addAppointment);
  const toggle = useServerFn(toggleAppointmentDone);
  const del = useServerFn(deleteAppointment);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["appts"], queryFn: () => list() });

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<"appointment" | "scan" | "supplement" | "hydration" | "other">("appointment");
  const [when, setWhen] = useState("");
  const [notes, setNotes] = useState("");

  async function submit() {
    if (!title || !when) return toast.error("Title and date required");
    try {
      await add({ data: { title, kind, scheduledAt: new Date(when).toISOString(), notes: notes || undefined } });
      setTitle(""); setWhen(""); setNotes(""); setOpen(false);
      qc.invalidateQueries({ queryKey: ["appts"] });
      toast.success("Reminder saved");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  const items = data?.appointments ?? [];
  const upcoming = items.filter((a: any) => !a.done);

  const kindIcon = (k: string) =>
    k === "scan" ? Activity : k === "supplement" ? Heart : k === "hydration" ? Droplet : BellRing;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink/60">{upcoming.length} upcoming</p>
        <button onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm text-cream">
          <CalendarPlus className="size-4" /> Add
        </button>
      </div>

      {open && (
        <div className="rounded-3xl bg-card p-4 ring-1 ring-zinc-950/5 space-y-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Title (e.g. 20-week scan)" className="w-full rounded-2xl bg-cream px-4 py-2.5 text-sm ring-1 ring-zinc-950/10 outline-none" />
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="w-full rounded-2xl bg-cream px-4 py-2.5 text-sm ring-1 ring-zinc-950/10 outline-none" />
          <div className="flex flex-wrap gap-2">
            {(["appointment", "scan", "supplement", "hydration", "other"] as const).map((k) => (
              <button key={k} onClick={() => setKind(k)} className={`rounded-full px-3 py-1.5 text-xs capitalize ring-1 ${kind === k ? "bg-ink text-cream ring-ink" : "bg-cream ring-zinc-950/10"}`}>{k}</button>
            ))}
          </div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} maxLength={500} placeholder="Notes (optional)" className="w-full rounded-2xl bg-cream px-4 py-2.5 text-sm ring-1 ring-zinc-950/10 outline-none" />
          <div className="flex gap-2">
            <button onClick={() => setOpen(false)} className="flex-1 rounded-full bg-cream px-4 py-2 text-sm ring-1 ring-zinc-950/10">Cancel</button>
            <button onClick={submit} className="flex-1 rounded-full bg-ink px-4 py-2 text-sm text-cream">Save</button>
          </div>
        </div>
      )}

      <ul className="space-y-2">
        {items.map((a: any) => {
          const Icon = kindIcon(a.kind);
          const d = new Date(a.scheduled_at);
          return (
            <li key={a.id} className={`flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-zinc-950/5 ${a.done ? "opacity-50" : ""}`}>
              <span className="size-9 rounded-full grid place-items-center bg-lavender/60"><Icon className="size-4 text-ink/70" /></span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{a.title}</p>
                <p className="text-[11px] text-ink/50">{d.toLocaleString()} · {a.kind}</p>
              </div>
              <button onClick={async () => { await toggle({ data: { id: a.id, done: !a.done } }); qc.invalidateQueries({ queryKey: ["appts"] }); }} className="rounded-full bg-cream px-3 py-1 text-[11px] ring-1 ring-zinc-950/10">
                {a.done ? "Undo" : "Done"}
              </button>
              <button onClick={async () => { await del({ data: { id: a.id } }); qc.invalidateQueries({ queryKey: ["appts"] }); }} className="size-8 grid place-items-center rounded-full hover:bg-cream">
                <Trash2 className="size-3.5 text-ink/40" />
              </button>
            </li>
          );
        })}
        {items.length === 0 && (
          <li className="rounded-2xl bg-lavender/40 p-5 text-center text-sm text-ink/60 ring-1 ring-zinc-950/5">
            Add scans, checkups, supplements, or hydration reminders.
          </li>
        )}
      </ul>
    </div>
  );
}

/* ---------- Tracking (mood, symptom, sleep, weight) ---------- */

function TrackingPanel() {
  const add = useServerFn(addPregnancyLog);
  const list = useServerFn(listPregnancyLogs);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["preg-logs"], queryFn: () => list({ data: { limit: 30 } }) });

  async function quick(kind: any, payload: any, label: string) {
    try {
      await add({ data: { kind, data: payload } });
      qc.invalidateQueries({ queryKey: ["preg-logs"] });
      toast.success(`Logged: ${label}`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  const [weight, setWeight] = useState("");
  const [sleep, setSleep] = useState("");
  const [symptom, setSymptom] = useState("");

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-card p-5 ring-1 ring-zinc-950/5">
        <div className="flex items-center gap-2"><Smile className="size-4 text-ink/60" /><p className="text-sm font-medium">How are you feeling?</p></div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { e: "😄", l: "great" }, { e: "🙂", l: "okay" }, { e: "😐", l: "meh" },
            { e: "😟", l: "anxious" }, { e: "😢", l: "low" }, { e: "🥱", l: "exhausted" },
          ].map((m) => (
            <button key={m.l} onClick={() => quick("mood", { emoji: m.e, label: m.l }, m.l)}
              className="rounded-full bg-cream px-3 py-1.5 text-sm ring-1 ring-zinc-950/10">
              <span className="mr-1">{m.e}</span>{m.l}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card p-4 ring-1 ring-zinc-950/5">
          <div className="flex items-center gap-2"><Scale className="size-4 text-ink/60" /><p className="text-xs font-medium">Weight (kg)</p></div>
          <div className="mt-2 flex gap-2">
            <input value={weight} onChange={(e) => setWeight(e.target.value)} type="number" step="0.1" placeholder="65.4"
              className="flex-1 rounded-full bg-cream px-3 py-1.5 text-sm ring-1 ring-zinc-950/10 outline-none" />
            <button onClick={() => { if (weight) { quick("weight", { kg: Number(weight) }, `${weight} kg`); setWeight(""); } }}
              className="rounded-full bg-ink px-3 py-1.5 text-xs text-cream">Log</button>
          </div>
        </div>
        <div className="rounded-2xl bg-card p-4 ring-1 ring-zinc-950/5">
          <div className="flex items-center gap-2"><Moon className="size-4 text-ink/60" /><p className="text-xs font-medium">Sleep (hrs)</p></div>
          <div className="mt-2 flex gap-2">
            <input value={sleep} onChange={(e) => setSleep(e.target.value)} type="number" step="0.5" placeholder="7"
              className="flex-1 rounded-full bg-cream px-3 py-1.5 text-sm ring-1 ring-zinc-950/10 outline-none" />
            <button onClick={() => { if (sleep) { quick("sleep", { hours: Number(sleep) }, `${sleep} h`); setSleep(""); } }}
              className="rounded-full bg-ink px-3 py-1.5 text-xs text-cream">Log</button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-card p-5 ring-1 ring-zinc-950/5">
        <div className="flex items-center gap-2"><ClipboardList className="size-4 text-ink/60" /><p className="text-sm font-medium">Symptoms</p></div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["nausea", "back pain", "swelling", "heartburn", "headache", "fatigue", "cramps"].map((s) => (
            <button key={s} onClick={() => quick("symptom", { name: s }, s)}
              className="rounded-full bg-cream px-3 py-1.5 text-xs ring-1 ring-zinc-950/10">+ {s}</button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input value={symptom} onChange={(e) => setSymptom(e.target.value)} maxLength={60} placeholder="Other symptom…"
            className="flex-1 rounded-full bg-cream px-3 py-1.5 text-sm ring-1 ring-zinc-950/10 outline-none" />
          <button onClick={() => { if (symptom.trim()) { quick("symptom", { name: symptom.trim() }, symptom.trim()); setSymptom(""); } }}
            className="rounded-full bg-ink px-3 py-1.5 text-xs text-cream">Add</button>
        </div>
      </section>

      <section>
        <p className="text-xs uppercase tracking-[0.15em] text-ink/40 mb-2">Recent</p>
        <ul className="space-y-2">
          {(data?.logs ?? []).map((l: any) => (
            <li key={l.id} className="rounded-2xl bg-card p-3 ring-1 ring-zinc-950/5 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm capitalize">{l.kind.replace("_", " ")}</p>
                <p className="text-[11px] text-ink/50 truncate">{summarizeLog(l)}</p>
              </div>
              <p className="text-[10px] text-ink/40">{new Date(l.logged_at).toLocaleString()}</p>
            </li>
          ))}
          {(data?.logs ?? []).length === 0 && <li className="text-xs text-ink/50">No logs yet.</li>}
        </ul>
      </section>
    </div>
  );
}

function summarizeLog(l: any) {
  const d = l.data || {};
  if (l.kind === "mood") return `${d.emoji ?? ""} ${d.label ?? ""}`;
  if (l.kind === "symptom") return d.name ?? "";
  if (l.kind === "weight") return `${d.kg} kg`;
  if (l.kind === "sleep") return `${d.hours} hours`;
  if (l.kind === "kick_session") return `${d.count ?? 0} kicks in ${Math.round((d.durationMs ?? 0) / 60000)} min`;
  if (l.kind === "contraction_session") return `${d.contractions?.length ?? 0} contractions`;
  return JSON.stringify(d);
}

/* ---------- Tools: kick counter, contraction timer, hospital bag ---------- */

function Tools() {
  const [tool, setTool] = useState<"kicks" | "contractions" | "bag">("kicks");
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {([
          ["kicks", Footprints, "Kicks"], ["contractions", Timer, "Contractions"], ["bag", ListChecks, "Hospital bag"],
        ] as [any, any, string][]).map(([k, I, l]) => (
          <button key={k} onClick={() => setTool(k)}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl px-3 py-2 text-xs ring-1 ${
              tool === k ? "bg-ink text-cream ring-ink" : "bg-card text-ink/70 ring-zinc-950/10"
            }`}>
            <I className="size-3.5" />{l}
          </button>
        ))}
      </div>
      {tool === "kicks" && <KickCounter />}
      {tool === "contractions" && <ContractionTimer />}
      {tool === "bag" && <HospitalBag />}
    </div>
  );
}

function RecentSessions({ kind, title, render }: { kind: "kick_session" | "contraction_session"; title: string; render: (d: any) => string }) {
  const list = useServerFn(listPregnancyLogs);
  const { data } = useQuery({ queryKey: ["preg-logs", kind], queryFn: () => list({ data: { kind, limit: 5 } }) });
  const logs = data?.logs ?? [];
  if (!logs.length) return null;
  return (
    <section className="mt-4">
      <p className="text-xs uppercase tracking-[0.15em] text-ink/40 mb-2">{title}</p>
      <ul className="space-y-2">
        {logs.map((l: any) => (
          <li key={l.id} className="rounded-2xl bg-card p-3 ring-1 ring-zinc-950/5 flex items-center justify-between">
            <p className="text-sm">{render(l.data || {})}</p>
            <p className="text-[10px] text-ink/40">{new Date(l.logged_at).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function KickCounter() {
  const add = useServerFn(addPregnancyLog);
  const qc = useQueryClient();
  const [count, setCount] = useState(0);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed(Date.now() - (startRef.current ?? Date.now())), 1000);
    return () => clearInterval(t);
  }, [running]);

  function start() {
    startRef.current = Date.now();
    setCount(0); setElapsed(0); setRunning(true);
  }
  async function stop() {
    setRunning(false);
    const ms = Date.now() - (startRef.current ?? Date.now());
    if (count > 0) {
      try {
        await add({ data: { kind: "kick_session", data: { count, durationMs: ms } } });
        qc.invalidateQueries({ queryKey: ["preg-logs", "kick_session"] });
        qc.invalidateQueries({ queryKey: ["preg-logs"] });
        toast.success(`Logged ${count} kicks`);
      } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    }
  }
  function tap() { if (running) setCount((c) => c + 1); }

  const mins = Math.floor(elapsed / 60000);
  const secs = Math.floor((elapsed % 60000) / 1000);

  return (
    <div>
      <div className="rounded-3xl bg-card p-6 ring-1 ring-zinc-950/5 text-center space-y-4">
        <Baby className="size-6 mx-auto text-ink/60" />
        <p className="text-xs text-ink/60">Tap each time you feel a kick. Aim for 10 kicks within 2 hours.</p>
        <button onClick={tap} disabled={!running}
          className="mx-auto block size-40 rounded-full bg-lavender/70 text-4xl font-semibold ring-1 ring-zinc-950/10 disabled:opacity-50">
          {count}
        </button>
        <p className="text-sm tabular-nums text-ink/60">{String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}</p>
        <div className="flex gap-2 justify-center">
          {!running ? (
            <button onClick={start} className="rounded-full bg-ink px-5 py-2 text-sm text-cream">Start session</button>
          ) : (
            <button onClick={stop} className="rounded-full bg-ink px-5 py-2 text-sm text-cream">Stop & save</button>
          )}
        </div>
      </div>
      <RecentSessions kind="kick_session" title="Recent kick sessions"
        render={(d) => `${d.count ?? 0} kicks in ${Math.round((d.durationMs ?? 0) / 60000)} min`} />
    </div>
  );
}

function ContractionTimer() {
  const add = useServerFn(addPregnancyLog);
  const qc = useQueryClient();
  const [contractions, setContractions] = useState<{ start: number; end?: number }[]>([]);
  const [active, setActive] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  function toggle() {
    if (!active) {
      setContractions((c) => [...c, { start: Date.now() }]);
      setActive(true);
    } else {
      setContractions((c) => c.map((x, i) => i === c.length - 1 ? { ...x, end: Date.now() } : x));
      setActive(false);
    }
  }

  const finished = contractions.filter((c) => c.end);
  const intervals = finished.slice(1).map((c, i) => (c.start - finished[i].start) / 1000);
  const avgInterval = intervals.length ? Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length) : 0;
  const avgDur = finished.length ? Math.round(finished.reduce((a, c) => a + ((c.end! - c.start) / 1000), 0) / finished.length) : 0;
  const current = active && contractions.length ? Math.round((now - contractions[contractions.length - 1].start) / 1000) : 0;

  async function save() {
    if (!finished.length) return;
    try {
      await add({ data: { kind: "contraction_session", data: { contractions: finished, avgInterval, avgDur } } });
      qc.invalidateQueries({ queryKey: ["preg-logs", "contraction_session"] });
      qc.invalidateQueries({ queryKey: ["preg-logs"] });
      toast.success("Session saved");
      setContractions([]);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  return (
    <div>
      <div className="rounded-3xl bg-card p-6 ring-1 ring-zinc-950/5 space-y-4">
        <p className="text-xs text-ink/60 text-center">Tap to start a contraction, tap again when it ends.</p>
        <button onClick={toggle}
          className={`mx-auto block size-32 rounded-full text-lg font-medium ring-1 ring-zinc-950/10 ${active ? "bg-rose-100 text-rose-900" : "bg-lavender/70"}`}>
          {active ? `${current}s` : "Tap"}
        </button>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Count" value={finished.length} />
          <Stat label="Avg length" value={`${avgDur}s`} />
          <Stat label="Avg interval" value={`${avgInterval}s`} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setContractions([])} className="flex-1 rounded-full bg-cream px-4 py-2 text-sm ring-1 ring-zinc-950/10">Clear</button>
          <button onClick={save} disabled={!finished.length} className="flex-1 rounded-full bg-ink px-4 py-2 text-sm text-cream disabled:opacity-40">Save</button>
        </div>
        <p className="text-[11px] text-ink/50 text-center">
          Contractions ~5 min apart, ~1 min long, for an hour → call your provider.
        </p>
      </div>
      <RecentSessions kind="contraction_session" title="Recent contraction sessions"
        render={(d) => `${d.contractions?.length ?? 0} contractions · avg ${d.avgDur ?? 0}s, every ${d.avgInterval ?? 0}s`} />
    </div>
  );
}



function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl bg-cream p-3 ring-1 ring-zinc-950/10">
      <p className="text-[10px] uppercase tracking-wider text-ink/50">{label}</p>
      <p className="mt-1 text-base font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function HospitalBag() {
  const list = useServerFn(listBagItems);
  const toggle = useServerFn(toggleBagItem);
  const add = useServerFn(addBagItem);
  const del = useServerFn(deleteBagItem);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["bag"], queryFn: () => list() });
  const [label, setLabel] = useState("");
  const [cat, setCat] = useState<"mom" | "baby" | "partner" | "documents">("mom");

  const items = data?.items ?? [];
  const groups: Record<string, any[]> = {};
  items.forEach((i: any) => { (groups[i.category] ??= []).push(i); });
  const packed = items.filter((i: any) => i.packed).length;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-lavender/60 p-3 ring-1 ring-zinc-950/5 text-xs">
        Packed {packed} of {items.length}
      </div>
      {Object.entries(groups).map(([g, arr]) => (
        <section key={g}>
          <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40 mb-1.5">{g}</p>
          <ul className="space-y-1.5">
            {arr.map((i) => (
              <li key={i.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-zinc-950/5">
                <input type="checkbox" checked={i.packed}
                  onChange={async (e) => { await toggle({ data: { id: i.id, packed: e.target.checked } }); qc.invalidateQueries({ queryKey: ["bag"] }); }}
                  className="size-4 accent-ink" />
                <span className={`flex-1 text-sm ${i.packed ? "line-through text-ink/40" : ""}`}>{i.label}</span>
                <button onClick={async () => { await del({ data: { id: i.id } }); qc.invalidateQueries({ queryKey: ["bag"] }); }} className="size-7 grid place-items-center rounded-full hover:bg-cream">
                  <Trash2 className="size-3 text-ink/40" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <div className="rounded-2xl bg-card p-3 ring-1 ring-zinc-950/5 space-y-2">
        <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={80} placeholder="Add an item…"
          className="w-full rounded-full bg-cream px-3 py-1.5 text-sm ring-1 ring-zinc-950/10 outline-none" />
        <div className="flex gap-2">
          {(["mom", "baby", "partner", "documents"] as const).map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`flex-1 rounded-full px-2 py-1 text-[11px] capitalize ring-1 ${cat === c ? "bg-ink text-cream ring-ink" : "bg-cream ring-zinc-950/10"}`}>{c}</button>
          ))}
        </div>
        <button onClick={async () => {
          if (!label.trim()) return;
          await add({ data: { label: label.trim(), category: cat } });
          setLabel(""); qc.invalidateQueries({ queryKey: ["bag"] });
        }} className="w-full rounded-full bg-ink px-4 py-2 text-sm text-cream inline-flex items-center justify-center gap-1.5">
          <Plus className="size-3.5" /> Add item
        </button>
      </div>
    </div>
  );
}

/* ---------- Birth Plan ---------- */

const BIRTH_QS: { key: string; q: string; options: string[] }[] = [
  { key: "location", q: "Preferred birth location", options: ["Hospital", "Birth center", "Home birth"] },
  { key: "painRelief", q: "Pain relief preference", options: ["Unmedicated", "Open to epidural", "Definitely epidural", "Undecided"] },
  { key: "support", q: "Who do you want present?", options: ["Partner", "Doula", "Family member", "Just medical team"] },
  { key: "mobility", q: "Movement during labor", options: ["Free to move", "Birthing ball", "Water immersion", "Bed rest if needed"] },
  { key: "afterBirth", q: "Right after birth", options: ["Skin-to-skin immediately", "Delayed cord clamping", "Partner cuts cord", "Photos welcome"] },
  { key: "feeding", q: "Feeding intention", options: ["Breastfeed", "Formula", "Combination", "Decide later"] },
];

function BirthPlanPanel() {
  const get = useServerFn(getBirthPlan);
  const save = useServerFn(saveBirthPlan);
  const fetchMe = useServerFn(getMe);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["birth-plan"], queryFn: () => get() });
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => fetchMe() });
  const [prefs, setPrefs] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (data?.plan) {
      const p = (data.plan.preferences ?? {}) as any;
      setPrefs(p.choices ?? {});
      setNotes(p.notes ?? "");
    }
  }, [data]);

  async function persist() {
    try {
      await save({ data: { preferences: { choices: prefs, notes } } });
      qc.invalidateQueries({ queryKey: ["birth-plan"] });
      toast.success("Birth plan saved");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  function exportPDF() {
    const answered = BIRTH_QS.filter((q) => prefs[q.key]);
    if (!answered.length && !notes.trim()) {
      toast.error("Make a few selections first");
      return;
    }
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    const margin = 56;
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    let y = margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Birth Plan", margin, y);
    y += 26;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(110);
    const parentName = me?.profile?.parent_name ?? "";
    const meta = [
      parentName && `Parent: ${parentName}`,
      me?.babies?.[0]?.pregnancy_due_date && `Due date: ${new Date(me.babies[0].pregnancy_due_date).toLocaleDateString()}`,
      `Generated: ${new Date().toLocaleDateString()}`,
    ].filter(Boolean).join("   ·   ");
    doc.text(meta, margin, y);
    y += 24;
    doc.setTextColor(0);

    const writeLine = (label: string, value: string) => {
      if (y > pageH - margin - 40) { doc.addPage(); y = margin; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(label, margin, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      const lines = doc.splitTextToSize(value, pageW - margin * 2);
      doc.text(lines, margin, y);
      y += lines.length * 16 + 10;
    };

    for (const q of BIRTH_QS) {
      writeLine(q.q, prefs[q.key] || "—");
    }
    if (notes.trim()) writeLine("Additional wishes", notes.trim());

    if (y > pageH - margin - 40) { doc.addPage(); y = margin; }
    doc.setFontSize(9);
    doc.setTextColor(140);
    doc.text(
      "This birth plan reflects preferences and is not a medical directive. Discuss with your provider.",
      margin, pageH - margin / 2,
    );

    doc.save(`birth-plan-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("PDF downloaded");
  }

  const answeredCount = BIRTH_QS.filter((q) => prefs[q.key]).length;

  return (
    <div className="space-y-3">
      {BIRTH_QS.map((q) => (
        <section key={q.key} className="rounded-2xl bg-card p-4 ring-1 ring-zinc-950/5">
          <p className="text-sm font-medium">{q.q}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {q.options.map((o) => (
              <button key={o} onClick={() => setPrefs((p) => ({ ...p, [q.key]: o }))}
                className={`rounded-full px-3 py-1.5 text-xs ring-1 ${prefs[q.key] === o ? "bg-ink text-cream ring-ink" : "bg-cream ring-zinc-950/10"}`}>
                {o}
              </button>
            ))}
          </div>
        </section>
      ))}
      <section className="rounded-2xl bg-card p-4 ring-1 ring-zinc-950/5">
        <p className="text-sm font-medium">Anything else?</p>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} maxLength={1000}
          placeholder="Special wishes, cultural practices, things to avoid…"
          className="mt-2 w-full rounded-2xl bg-cream px-3 py-2 text-sm ring-1 ring-zinc-950/10 outline-none" />
      </section>

      {(answeredCount > 0 || notes.trim()) && (
        <section className="rounded-2xl bg-lavender/60 p-4 ring-1 ring-zinc-950/5">
          <p className="text-xs uppercase tracking-[0.15em] text-ink/50 mb-2">Review</p>
          <dl className="space-y-1.5 text-sm">
            {BIRTH_QS.filter((q) => prefs[q.key]).map((q) => (
              <div key={q.key} className="flex gap-2">
                <dt className="text-ink/60 shrink-0">{q.q}:</dt>
                <dd className="font-medium">{prefs[q.key]}</dd>
              </div>
            ))}
            {notes.trim() && (
              <div className="pt-1">
                <dt className="text-ink/60">Notes:</dt>
                <dd className="mt-0.5 whitespace-pre-wrap">{notes}</dd>
              </div>
            )}
          </dl>
        </section>
      )}

      <div className="flex gap-2">
        <button onClick={persist} className="flex-1 rounded-full bg-ink px-5 py-3 text-sm text-cream">Save</button>
        <button onClick={exportPDF} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-cream px-5 py-3 text-sm ring-1 ring-zinc-950/10">
          <Download className="size-4" /> Export PDF
        </button>
      </div>
    </div>
  );
}

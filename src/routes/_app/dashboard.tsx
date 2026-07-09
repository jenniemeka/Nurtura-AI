import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  Sparkles, Moon, Apple, Syringe, ArrowRight, Baby, Stethoscope, ListChecks,
  Footprints, Timer, Heart, BookOpen, CalendarPlus, CheckCircle2,
} from "lucide-react";
import { getMe } from "@/lib/profile.functions";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Home — Nurtura" }] }),
  component: Dashboard,
});

function babyAgeText(birth?: string | null, due?: string | null, isPreg?: boolean) {
  if (isPreg && due) {
    const days = Math.round((new Date(due).getTime() - Date.now()) / 86400000);
    return days > 0 ? `${days} days until due date` : `Welcome to the world soon ✨`;
  }
  if (birth) {
    const months = (Date.now() - new Date(birth).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
    if (months < 1) return `${Math.max(0, Math.round(months * 30.44))} days old`;
    if (months < 24) return `${Math.round(months)} months old`;
    return `${(months / 12).toFixed(1)} years old`;
  }
  return "";
}

function weeksFromDue(due?: string | null) {
  if (!due) return null;
  const ms = new Date(due).getTime() - Date.now();
  const daysLeft = Math.round(ms / 86400000);
  const week = Math.max(1, Math.min(40, 40 - Math.round(daysLeft / 7)));
  return { week, daysLeft, trimester: week < 14 ? 1 : week < 28 ? 2 : 3 };
}

const FRUIT: Record<number, string> = {
  4: "poppy seed", 6: "lentil", 8: "raspberry", 10: "strawberry", 12: "lime",
  14: "lemon", 16: "avocado", 18: "bell pepper", 20: "banana", 22: "papaya",
  24: "corn", 26: "lettuce", 28: "eggplant", 30: "cabbage", 32: "squash",
  34: "cantaloupe", 36: "honeydew", 38: "pumpkin", 40: "watermelon",
};
function fruitFor(week: number) {
  const keys = Object.keys(FRUIT).map(Number).sort((a, b) => a - b);
  let pick = keys[0];
  for (const k of keys) if (k <= week) pick = k;
  return FRUIT[pick];
}

const CONCERN_TIPS: Record<string, string> = {
  Sleep: "Wind-down routines and light cues help set rhythm.",
  Feeding: "Small, frequent feeds are gentler on tiny tummies.",
  Crying: "The 5 S's — swaddle, side, shush, swing, suck.",
  Development: "Tummy time in short, playful bursts.",
  Postpartum: "Rest is productive. Ask for one small handoff today.",
  "Mental load": "Write one thing down. Let the app hold the rest.",
  Health: "Track symptoms and share them with your clinician.",
  Routine: "Anchor the day to feeds, naps, and one walk.",
};

function Dashboard() {
  const fetchMe = useServerFn(getMe);
  const { data, isLoading } = useQuery({ queryKey: ["me"], queryFn: () => fetchMe() });
  const profile = data?.profile;
  const baby = data?.babies?.[0];
  const isPregnant = !!baby?.is_pregnancy;
  const w = useMemo(() => weeksFromDue(baby?.pregnancy_due_date), [baby?.pregnancy_due_date]);
  const firstName = profile?.parent_name?.split(" ")[0] ?? "there";
  const concerns = (profile?.concerns ?? []) as string[];

  if (isLoading) {
    return <p className="text-sm text-ink/40">Loading your space…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.15em] text-ink/40">
          {isPregnant ? "Pregnancy" : "Today"}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-balance">
          Hi {firstName} 👋
        </h1>
        {baby && (
          <p className="mt-1 text-ink/60 text-sm">
            {baby.name} • {babyAgeText(baby.birth_date, baby.pregnancy_due_date, baby.is_pregnancy)}
          </p>
        )}
      </div>

      {isPregnant ? <PregnancyHome babyName={baby?.name ?? "baby"} w={w} concerns={concerns} />
                  : <ParentHome concerns={concerns} />}
    </div>
  );
}

/* ---------- Pregnancy dashboard ---------- */

function PregnancyHome({ babyName, w, concerns }: { babyName: string; w: ReturnType<typeof weeksFromDue>; concerns: string[] }) {
  const pct = w ? Math.min(100, Math.round((w.week / 40) * 100)) : 0;
  const fruit = w ? fruitFor(w.week) : null;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-lavender/60 p-6 ring-1 ring-zinc-950/5">
        <p className="text-xs uppercase tracking-[0.15em] text-ink/50">Weekly progress</p>
        {w ? (
          <>
            <p className="mt-2 text-base text-pretty">
              You're in <span className="font-semibold">week {w.week}</span> · trimester {w.trimester}.
              {babyName} is about the size of a <span className="font-medium">{fruit}</span>.
            </p>
            <div className="mt-4 h-2 rounded-full bg-cream overflow-hidden">
              <div className="h-full bg-ink" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1 text-[10px] tracking-wider text-ink/40">
              {pct}% of 40 weeks · {w.daysLeft > 0 ? `${w.daysLeft} days to go` : "any day now"}
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm text-ink/70">Add a due date in your profile to see weekly progress.</p>
        )}
        <Link to="/pregnancy" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs text-cream">
          Open pregnancy hub <ArrowRight className="size-3.5" />
        </Link>
      </section>

      <section className="rounded-3xl bg-card p-5 ring-1 ring-zinc-950/5">
        <p className="text-xs uppercase tracking-[0.15em] text-ink/40">This trimester</p>
        <ul className="mt-2 space-y-1.5 text-sm text-ink/80 list-disc pl-5">
          {w?.trimester === 1 && (<>
            <li>Prenatal vitamins with folate daily.</li>
            <li>Book your first-trimester scan (10–13 weeks).</li>
            <li>Rest often — fatigue is your body building a person.</li>
          </>)}
          {w?.trimester === 2 && (<>
            <li>Anatomy scan around week 20.</li>
            <li>Start gentle prenatal movement and pelvic floor work.</li>
            <li>Look out for first kicks between 18–22 weeks.</li>
          </>)}
          {w?.trimester === 3 && (<>
            <li>Daily kick counts from week 28.</li>
            <li>Pack your hospital bag and finalize the birth plan.</li>
            <li>Call your provider for heavy bleeding, bad headaches, or reduced movement.</li>
          </>)}
          {!w && <li>Add a due date to personalize this checklist.</li>}
        </ul>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/ai" className="rounded-2xl bg-card p-5 ring-1 ring-zinc-950/5 hover:shadow-sm transition-shadow">
          <Stethoscope className="size-5 text-ink/70" />
          <p className="mt-3 font-medium">Ask a question</p>
          <p className="text-xs text-ink/50 mt-1">Tuned to week {w?.week ?? "—"}.</p>
        </Link>
        <Link to="/pregnancy" className="rounded-2xl bg-card p-5 ring-1 ring-zinc-950/5 hover:shadow-sm transition-shadow">
          <Footprints className="size-5 text-ink/70" />
          <p className="mt-3 font-medium">Kick counter</p>
          <p className="text-xs text-ink/50 mt-1">Log baby's movements.</p>
        </Link>
        <Link to="/pregnancy" className="rounded-2xl bg-card p-5 ring-1 ring-zinc-950/5 hover:shadow-sm transition-shadow">
          <Timer className="size-5 text-ink/70" />
          <p className="mt-3 font-medium">Contraction timer</p>
          <p className="text-xs text-ink/50 mt-1">When labor begins.</p>
        </Link>
        <Link to="/pregnancy" className="rounded-2xl bg-card p-5 ring-1 ring-zinc-950/5 hover:shadow-sm transition-shadow">
          <ListChecks className="size-5 text-ink/70" />
          <p className="mt-3 font-medium">Hospital bag</p>
          <p className="text-xs text-ink/50 mt-1">Pack with confidence.</p>
        </Link>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Reminders</h2>
        <div className="space-y-3">
          {[
            { icon: Heart, color: "bg-sage", title: "Prenatal vitamin", sub: "Take daily with food" },
            { icon: CalendarPlus, color: "bg-sky", title: "Next appointment", sub: "Add one from Pregnancy › Reminders" },
            { icon: Footprints, color: "bg-lavender", title: (w?.week ?? 0) >= 28 ? "Kick count" : "Gentle walk", sub: (w?.week ?? 0) >= 28 ? "10 movements in 2 hours" : "20 minutes helps circulation" },
          ].map(({ icon: Icon, color, title, sub }) => (
            <Link key={title} to="/pregnancy" className="flex items-center gap-4 rounded-2xl bg-card p-4 ring-1 ring-zinc-950/5">
              <div className={`size-10 rounded-full grid place-items-center ${color}`}><Icon className="size-4 text-ink/70" /></div>
              <div className="flex-1">
                <p className="font-medium text-sm">{title}</p>
                <p className="text-xs text-ink/50">{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <ConcernsCard concerns={concerns} />

      <section>
        <h2 className="text-lg font-semibold mb-3">Suggested reading</h2>
        <Link to="/learn" className="block rounded-2xl bg-card p-5 ring-1 ring-zinc-950/5">
          <p className="text-xs uppercase tracking-[0.15em] text-ink/40">Pregnancy</p>
          <p className="mt-2 font-medium">
            {w?.trimester === 1 && "First trimester: what's normal, what to watch"}
            {w?.trimester === 2 && "Second trimester: nutrition and movement"}
            {w?.trimester === 3 && "Third trimester: preparing for labor"}
            {!w && "Your pregnancy, week by week"}
          </p>
          <p className="text-sm text-ink/50 mt-1">Curated by clinicians, written for real life.</p>
        </Link>
      </section>
    </div>
  );
}

/* ---------- Parent (post-birth) dashboard ---------- */

function ParentHome({ concerns }: { concerns: string[] }) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-lavender/60 p-6 ring-1 ring-zinc-950/5">
        <p className="text-xs uppercase tracking-[0.15em] text-ink/50">Daily encouragement</p>
        <p className="mt-2 text-base text-pretty">
          You're doing better than you think. Tiny moments of presence are exactly what your baby needs today.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/ai" className="rounded-2xl bg-card p-5 ring-1 ring-zinc-950/5 hover:shadow-sm transition-shadow">
          <Sparkles className="size-5 text-ink/70" />
          <p className="mt-3 font-medium">Ask Nurtura AI</p>
          <p className="text-xs text-ink/50 mt-1">Gentle, instant guidance.</p>
        </Link>
        <Link to="/tracker" className="rounded-2xl bg-card p-5 ring-1 ring-zinc-950/5 hover:shadow-sm transition-shadow">
          <Baby className="size-5 text-ink/70" />
          <p className="mt-3 font-medium">Log a milestone</p>
          <p className="text-xs text-ink/50 mt-1">Track growth and progress.</p>
        </Link>
      </div>

      <ConcernsCard concerns={concerns} />

      <section>
        <h2 className="text-lg font-semibold mb-3">Reminders</h2>
        <div className="space-y-3">
          {[
            { icon: Apple, color: "bg-sage", title: "Next feed", sub: "Around 2 hours from now" },
            { icon: Moon, color: "bg-sky", title: "Wind-down soon", sub: "Dim lights, calm voice" },
            { icon: Syringe, color: "bg-lavender", title: "Vaccinations", sub: "Check upcoming schedule" },
          ].map(({ icon: Icon, color, title, sub }) => (
            <div key={title} className="flex items-center gap-4 rounded-2xl bg-card p-4 ring-1 ring-zinc-950/5">
              <div className={`size-10 rounded-full grid place-items-center ${color}`}><Icon className="size-4 text-ink/70" /></div>
              <div className="flex-1">
                <p className="font-medium text-sm">{title}</p>
                <p className="text-xs text-ink/50">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Suggested reading</h2>
        <Link to="/learn" className="block rounded-2xl bg-card p-5 ring-1 ring-zinc-950/5">
          <p className="text-xs uppercase tracking-[0.15em] text-ink/40">Sleep</p>
          <p className="mt-2 font-medium">Newborn sleep, simply explained</p>
          <p className="text-sm text-ink/50 mt-1">Why fragmented nights are normal — and what to expect by week.</p>
        </Link>
      </section>
    </div>
  );
}

function ConcernsCard({ concerns }: { concerns: string[] }) {
  if (!concerns.length) return null;
  return (
    <section className="rounded-3xl bg-card p-5 ring-1 ring-zinc-950/5">
      <div className="flex items-center gap-2">
        <BookOpen className="size-4 text-ink/60" />
        <p className="text-sm font-medium">For what's on your mind</p>
      </div>
      <div className="mt-3 space-y-2">
        {concerns.slice(0, 4).map((c) => (
          <div key={c} className="rounded-2xl bg-cream p-3 ring-1 ring-zinc-950/10">
            <p className="text-xs uppercase tracking-[0.15em] text-ink/50">{c}</p>
            <p className="mt-1 text-sm text-ink/80">{CONCERN_TIPS[c] ?? "We'll surface guidance tailored to this."}</p>
          </div>
        ))}
      </div>
      <Link to="/ai" className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs text-cream">
        Ask about this <ArrowRight className="size-3.5" />
      </Link>
    </section>
  );
}

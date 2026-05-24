import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Moon, Apple, Syringe, ArrowRight } from "lucide-react";
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

function Dashboard() {
  const fetchMe = useServerFn(getMe);
  const { data, isLoading } = useQuery({ queryKey: ["me"], queryFn: () => fetchMe() });
  const profile = data?.profile;
  const baby = data?.babies?.[0];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.15em] text-ink/40">Today</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-balance">
          Hi {profile?.parent_name?.split(" ")[0] ?? "there"} 👋
        </h1>
        {baby && <p className="mt-1 text-ink/60 text-sm">{baby.name} • {babyAgeText(baby.birth_date, baby.pregnancy_due_date, baby.is_pregnancy)}</p>}
      </div>

      <div className="rounded-3xl bg-lavender/60 p-6 ring-1 ring-zinc-950/5">
        <p className="text-xs uppercase tracking-[0.15em] text-ink/50">Daily encouragement</p>
        <p className="mt-2 text-base text-pretty">You're doing better than you think. Tiny moments of presence are exactly what your baby needs today.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/ai" className="rounded-2xl bg-card p-5 ring-1 ring-zinc-950/5 hover:shadow-sm transition-shadow">
          <Sparkles className="size-5 text-ink/70" />
          <p className="mt-3 font-medium">Ask Nurtura AI</p>
          <p className="text-xs text-ink/50 mt-1">Get gentle, instant guidance.</p>
        </Link>
        <Link to="/tracker" className="rounded-2xl bg-card p-5 ring-1 ring-zinc-950/5 hover:shadow-sm transition-shadow">
          <ArrowRight className="size-5 text-ink/70" />
          <p className="mt-3 font-medium">Log a milestone</p>
          <p className="text-xs text-ink/50 mt-1">Track growth and progress.</p>
        </Link>
      </div>

      <div>
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
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Suggested reading</h2>
        <Link to="/learn" className="block rounded-2xl bg-card p-5 ring-1 ring-zinc-950/5">
          <p className="text-xs uppercase tracking-[0.15em] text-ink/40">Sleep</p>
          <p className="mt-2 font-medium">Newborn sleep, simply explained</p>
          <p className="text-sm text-ink/50 mt-1">Why fragmented nights are normal — and what to expect by week.</p>
        </Link>
      </div>

      {isLoading && <p className="text-xs text-ink/40">Loading…</p>}
    </div>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { completeOnboarding } from "@/lib/profile.functions";
import { AuthShell, Input } from "@/components/auth-shell";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — Nurtura" }] }),
  component: Onboarding,
});

const CONCERNS = ["Sleep", "Feeding", "Crying", "Development", "Postpartum", "Mental load", "Health", "Routine"];

const AGE_BUCKETS = [
  { id: "0-2m", label: "0–2 mo", months: 1 },
  { id: "3-5m", label: "3–5 mo", months: 4 },
  { id: "6-8m", label: "6–8 mo", months: 7 },
  { id: "9-11m", label: "9–11 mo", months: 10 },
  { id: "12-17m", label: "12–17 mo", months: 14 },
  { id: "18-24m", label: "18–24 mo", months: 21 },
  { id: "2-3y", label: "2–3 yr", months: 30 },
  { id: "3y+", label: "3 yr +", months: 42 },
] as const;

function monthsAgoToDate(months: number) {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

function Onboarding() {
  const nav = useNavigate();
  const onboard = useServerFn(completeOnboarding);
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(false);

  const [step, setStep] = useState(0);
  const [parentName, setParentName] = useState("");
  const [stage, setStage] = useState<"pregnant" | "newborn">("newborn");
  const [babyName, setBabyName] = useState("");
  const [ageBucket, setAgeBucket] = useState<string>("");
  const [date, setDate] = useState("");
  const [concerns, setConcerns] = useState<string[]>([]);
  const [supportLevel, setSupportLevel] = useState(3);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Wait for session (auth may still be persisting right after signup),
  // then send already-onboarded users straight to the dashboard.
  useEffect(() => {
    let cancelled = false;
    async function resolve(userId: string | null) {
      if (cancelled) return;
      if (!userId) {
        nav({ to: "/login", replace: true });
        return;
      }
      const { data } = await supabase.from("profiles").select("onboarded, parent_name").eq("id", userId).maybeSingle();
      if (cancelled) return;
      if (data?.onboarded) {
        nav({ to: "/dashboard", replace: true });
        return;
      }
      if (data?.parent_name) setParentName(data.parent_name);
      setReady(true);
    }

    supabase.auth.getSession().then(({ data }) => resolve(data.session?.user.id ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) resolve(session.user.id);
    });
    // Give the session up to ~2s to appear before bouncing to /login.
    const timeout = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session && !cancelled) nav({ to: "/login", replace: true });
    }, 2000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [nav]);


  const effectiveDate = useMemo(() => {
    if (date) return date;
    if (stage === "newborn" && ageBucket) {
      const b = AGE_BUCKETS.find((x) => x.id === ageBucket);
      if (b) return monthsAgoToDate(b.months);
    }
    return "";
  }, [date, ageBucket, stage]);

  function toggleConcern(c: string) {
    setConcerns((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  }

  async function finish() {
    if (!parentName.trim() || !babyName.trim()) return toast.error("Please fill in your name and baby's name.");
    setSubmitting(true);
    try {
      await onboard({
        data: {
          parentName,
          concerns,
          concernsNotes: notes.trim() || undefined,
          supportLevel,
          baby: {
            name: babyName,
            isPregnancy: stage === "pregnant",
            birthDate: stage === "newborn" ? effectiveDate || undefined : undefined,
            pregnancyDueDate: stage === "pregnant" ? effectiveDate || undefined : undefined,
          },
        },
      });
      // Refresh the auth session so any newly-issued claims (e.g. onboarded)
      // are on the bearer, then drop cached profile data so the dashboard
      // reads the freshly-saved onboarding answers on mount.
      await supabase.auth.refreshSession().catch(() => {});
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      queryClient.removeQueries({ queryKey: ["me"] });
      nav({ to: "/dashboard", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  if (!ready) {
    return <AuthShell title="Loading…" sub="One moment while we set things up."><div className="h-8" /></AuthShell>;
  }

  return (
    <AuthShell title="Let's set things up" sub={`Step ${step + 1} of 3`}>

      {step === 0 && (
        <div className="space-y-3">
          <Input placeholder="Your name" value={parentName} onChange={(e) => setParentName(e.target.value)} maxLength={80} />
          <button onClick={() => setStep(1)} disabled={!parentName.trim()} className="w-full rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream disabled:opacity-50">Continue</button>
        </div>
      )}
      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {(["pregnant", "newborn"] as const).map((s) => (
              <button key={s} onClick={() => setStage(s)} className={`rounded-2xl px-4 py-4 text-sm font-medium ring-1 ${stage === s ? "bg-ink text-cream ring-ink" : "bg-card text-ink ring-zinc-950/10"}`}>
                {s === "pregnant" ? "Pregnant" : "Have a baby"}
              </button>
            ))}
          </div>
          <Input placeholder={stage === "pregnant" ? "Baby's name (or nickname)" : "Baby's name"} value={babyName} onChange={(e) => setBabyName(e.target.value)} maxLength={60} />

          {stage === "newborn" ? (
            <div className="space-y-2">
              <label className="text-xs text-ink/60 block">Age range</label>
              <div className="flex flex-wrap gap-2">
                {AGE_BUCKETS.map((b) => (
                  <button key={b.id} type="button" onClick={() => { setAgeBucket(b.id); setDate(""); }}
                    className={`rounded-full px-3 py-1.5 text-xs ring-1 ${ageBucket === b.id ? "bg-ink text-cream ring-ink" : "bg-card text-ink ring-zinc-950/10"}`}>
                    {b.label}
                  </button>
                ))}
              </div>
              <details className="pt-1">
                <summary className="text-xs text-ink/50 cursor-pointer">Know the exact birth date?</summary>
                <div className="mt-2">
                  <Input type="date" value={date} onChange={(e) => { setDate(e.target.value); setAgeBucket(""); }} />
                </div>
              </details>
            </div>
          ) : (
            <div>
              <label className="text-xs text-ink/60 mb-1 block">Due date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => setStep(0)} className="flex-1 rounded-full bg-card px-5 py-3 text-sm font-medium ring-1 ring-zinc-950/10">Back</button>
            <button onClick={() => setStep(2)} disabled={!babyName.trim()} className="flex-1 rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream disabled:opacity-50">Continue</button>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-ink/60">What's most on your mind right now?</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {CONCERNS.map((c) => (
                <button key={c} onClick={() => toggleConcern(c)} className={`rounded-full px-4 py-2 text-sm ring-1 ${concerns.includes(c) ? "bg-ink text-cream ring-ink" : "bg-card text-ink ring-zinc-950/10"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-ink/60">How supported do you feel?</label>
              <span className="text-xs text-ink/50">{["Overwhelmed", "Struggling", "Coping", "Steady", "Confident"][supportLevel - 1]}</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              value={supportLevel}
              onChange={(e) => setSupportLevel(Number(e.target.value))}
              className="mt-2 w-full accent-ink"
            />
          </div>

          <div>
            <label className="text-xs text-ink/60 mb-1 block">Anything else you'd like Nurtura to know? (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. We're navigating reflux and short naps."
              rows={3}
              maxLength={500}
              className="w-full rounded-2xl bg-card px-4 py-3 text-sm ring-1 ring-zinc-950/10 outline-none"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={() => setStep(1)} className="flex-1 rounded-full bg-card px-5 py-3 text-sm font-medium ring-1 ring-zinc-950/10">Back</button>
            <button onClick={finish} disabled={submitting} className="flex-1 rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream disabled:opacity-50">
              {submitting ? "Saving…" : "Finish"}
            </button>
          </div>
        </div>
      )}
    </AuthShell>
  );
}

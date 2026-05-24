import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/hooks/use-auth";
import { completeOnboarding } from "@/lib/profile.functions";
import { AuthShell, Input } from "./login";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Welcome — Nurtura" }] }),
  component: Onboarding,
});

const CONCERNS = ["Sleep", "Feeding", "Crying", "Development", "Postpartum", "Mental load"];

function Onboarding() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const onboard = useServerFn(completeOnboarding);

  const [step, setStep] = useState(0);
  const [parentName, setParentName] = useState("");
  const [stage, setStage] = useState<"pregnant" | "newborn">("newborn");
  const [babyName, setBabyName] = useState("");
  const [date, setDate] = useState("");
  const [concerns, setConcerns] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

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
          baby: {
            name: babyName,
            isPregnancy: stage === "pregnant",
            birthDate: stage === "newborn" ? date || undefined : undefined,
            pregnancyDueDate: stage === "pregnant" ? date || undefined : undefined,
          },
        },
      });
      nav({ to: "/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
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
          <div>
            <label className="text-xs text-ink/60 mb-1 block">{stage === "pregnant" ? "Due date" : "Birth date"}</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(0)} className="flex-1 rounded-full bg-card px-5 py-3 text-sm font-medium ring-1 ring-zinc-950/10">Back</button>
            <button onClick={() => setStep(2)} disabled={!babyName.trim()} className="flex-1 rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream disabled:opacity-50">Continue</button>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-ink/60">What's most on your mind right now?</p>
          <div className="flex flex-wrap gap-2">
            {CONCERNS.map((c) => (
              <button key={c} onClick={() => toggleConcern(c)} className={`rounded-full px-4 py-2 text-sm ring-1 ${concerns.includes(c) ? "bg-ink text-cream ring-ink" : "bg-card text-ink ring-zinc-950/10"}`}>
                {c}
              </button>
            ))}
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

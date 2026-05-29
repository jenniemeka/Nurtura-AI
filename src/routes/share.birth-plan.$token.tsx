import { createFileRoute, notFound } from "@tanstack/react-router";
import { getSharedBirthPlan } from "@/lib/pregnancy.functions";

export const Route = createFileRoute("/share/birth-plan/$token")({
  head: () => ({ meta: [{ title: "Birth Plan — Nurtura" }] }),
  loader: async ({ params }) => {
    const r = await getSharedBirthPlan({ data: { token: params.token } });
    if (!r.plan) throw notFound();
    return r;
  },
  notFoundComponent: () => (
    <main className="min-h-screen grid place-items-center bg-cream p-6">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.15em] text-ink/40">Not available</p>
        <h1 className="mt-2 text-xl font-semibold">This birth plan link is no longer active.</h1>
      </div>
    </main>
  ),
  errorComponent: () => (
    <main className="min-h-screen grid place-items-center bg-cream p-6">
      <p className="text-sm text-ink/60">Unable to load this birth plan.</p>
    </main>
  ),
  component: SharedBirthPlan,
});

function SharedBirthPlan() {
  const { plan, parentName, dueDate } = Route.useLoaderData();
  const p = (plan?.preferences ?? {}) as { choices?: Record<string, string>; notes?: string };
  const choices = p.choices ?? {};
  const notes = p.notes ?? "";

  const LABELS: Record<string, string> = {
    location: "Preferred birth location",
    painRelief: "Pain relief preference",
    support: "Who do you want present?",
    mobility: "Movement during labor",
    afterBirth: "Right after birth",
    feeding: "Feeding intention",
  };

  return (
    <main className="min-h-screen bg-cream py-10 px-5">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6">
          <p className="text-xs uppercase tracking-[0.15em] text-ink/40">Birth plan</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {parentName ? `${parentName}'s plan` : "Birth plan"}
          </h1>
          {dueDate && (
            <p className="mt-1 text-sm text-ink/60">
              Due {new Date(dueDate).toLocaleDateString()}
            </p>
          )}
        </header>

        <section className="rounded-3xl bg-card p-6 ring-1 ring-zinc-950/5 space-y-4">
          {Object.keys(LABELS).map((k) =>
            choices[k] ? (
              <div key={k}>
                <p className="text-xs uppercase tracking-[0.15em] text-ink/50">{LABELS[k]}</p>
                <p className="mt-1 text-base font-medium">{choices[k]}</p>
              </div>
            ) : null,
          )}
          {notes && (
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-ink/50">Additional wishes</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{notes}</p>
            </div>
          )}
        </section>

        <p className="mt-6 text-[11px] text-ink/40 text-center">
          Shared via Nurtura. This birth plan reflects preferences and is not a medical directive.
        </p>
      </div>
    </main>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldAlert, Check, X, EyeOff } from "lucide-react";
import {
  getMyRoles, adminListApplications, adminReviewApplication,
  adminModerationQueue, adminSetModeration,
} from "@/lib/expert.functions";

export const Route = createFileRoute("/_app/admin")({
  head: () => ({ meta: [{ title: "Admin — Nurtura" }] }),
  component: AdminPage,
});

function AdminPage() {
  const fetchRoles = useServerFn(getMyRoles);
  const { data, isLoading } = useQuery({ queryKey: ["my-roles"], queryFn: () => fetchRoles() });
  if (isLoading) return <p className="text-sm text-ink/40">Loading…</p>;
  if (!data?.roles.includes("admin")) {
    return (
      <div className="rounded-3xl bg-white p-8 ring-1 ring-zinc-950/5 text-center">
        <ShieldAlert className="size-8 mx-auto text-ink/30" />
        <p className="mt-3 text-sm text-ink/60">Admin access required.</p>
        <Link to="/dashboard" className="mt-3 inline-flex text-xs underline">Back home</Link>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.15em] text-ink/40">Admin</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Moderation</h1>
      </header>
      <ApplicationsPanel />
      <ModerationPanel />
    </div>
  );
}

function ApplicationsPanel() {
  const qc = useQueryClient();
  const list = useServerFn(adminListApplications);
  const review = useServerFn(adminReviewApplication);
  const { data } = useQuery({ queryKey: ["admin-apps"], queryFn: () => list() });
  const m = useMutation({
    mutationFn: (v: { applicationId: string; decision: "approved" | "rejected"; notes?: string }) =>
      review({ data: v }),
    onSuccess: () => { toast.success("Reviewed"); qc.invalidateQueries({ queryKey: ["admin-apps"] }); },
  });
  const apps = (data?.applications ?? []).filter((a: any) => a.status === "pending");
  return (
    <section>
      <h2 className="text-xs uppercase tracking-wider text-ink/40 mb-2">Expert applications ({apps.length})</h2>
      <div className="space-y-3">
        {apps.map((a: any) => (
          <article key={a.id} className="rounded-3xl bg-white p-5 ring-1 ring-zinc-950/5 space-y-2">
            <p className="font-medium">{a.full_name} <span className="text-xs text-ink/50">— {a.title}</span></p>
            <p className="text-sm text-ink/70">{a.bio}</p>
            <p className="text-xs text-ink/60"><span className="text-ink/40">Credentials:</span> {a.credentials}</p>
            {a.specialties?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {a.specialties.map((s: string) => <span key={s} className="text-[10px] rounded-full bg-cream px-2 py-0.5">{s}</span>)}
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={() => m.mutate({ applicationId: a.id, decision: "approved" })}
                className="rounded-full bg-emerald-600 text-white px-4 py-1.5 text-xs inline-flex items-center gap-1">
                <Check className="size-3" /> Approve
              </button>
              <button onClick={() => {
                const notes = prompt("Reason (optional):") ?? undefined;
                m.mutate({ applicationId: a.id, decision: "rejected", notes });
              }}
                className="rounded-full bg-rose-600 text-white px-4 py-1.5 text-xs inline-flex items-center gap-1">
                <X className="size-3" /> Reject
              </button>
            </div>
          </article>
        ))}
        {!apps.length && <p className="text-sm text-ink/40">No pending applications.</p>}
      </div>
    </section>
  );
}

function ModerationPanel() {
  const qc = useQueryClient();
  const queue = useServerFn(adminModerationQueue);
  const setStatus = useServerFn(adminSetModeration);
  const { data } = useQuery({ queryKey: ["mod-queue"], queryFn: () => queue() });
  const m = useMutation({
    mutationFn: (v: { table: any; id: string; status: any }) => setStatus({ data: v }),
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["mod-queue"] }); },
  });

  const items: Array<{ table: any; id: string; title: string; body?: string; status: string }> = [
    ...(data?.articles ?? []).map((x: any) => ({ table: "articles", id: x.id, title: x.title, body: x.excerpt, status: x.moderation_status })),
    ...(data?.reels ?? []).map((x: any) => ({ table: "reels", id: x.id, title: x.title, body: x.description, status: x.moderation_status })),
    ...(data?.posts ?? []).map((x: any) => ({ table: "community_posts", id: x.id, title: x.title, body: x.body, status: x.moderation_status })),
    ...(data?.comments ?? []).map((x: any) => ({ table: "post_comments", id: x.id, title: "Comment", body: x.body, status: x.moderation_status })),
  ];

  return (
    <section>
      <h2 className="text-xs uppercase tracking-wider text-ink/40 mb-2">Moderation queue ({items.length})</h2>
      <div className="space-y-3">
        {items.map((x) => (
          <article key={x.table + x.id} className="rounded-3xl bg-white p-5 ring-1 ring-zinc-950/5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-[10px] uppercase tracking-wider text-ink/40">{x.table} · {x.status}</p>
                <p className="font-medium mt-0.5">{x.title}</p>
                {x.body && <p className="text-sm text-ink/70 mt-1 line-clamp-3">{x.body}</p>}
              </div>
            </div>
            <div className="flex gap-2 pt-3">
              <button onClick={() => m.mutate({ table: x.table, id: x.id, status: "approved" })}
                className="rounded-full bg-emerald-600 text-white px-3 py-1.5 text-xs inline-flex items-center gap-1">
                <Check className="size-3" /> Approve
              </button>
              <button onClick={() => m.mutate({ table: x.table, id: x.id, status: "hidden" })}
                className="rounded-full bg-zinc-700 text-white px-3 py-1.5 text-xs inline-flex items-center gap-1">
                <EyeOff className="size-3" /> Hide
              </button>
              <button onClick={() => m.mutate({ table: x.table, id: x.id, status: "rejected" })}
                className="rounded-full bg-rose-600 text-white px-3 py-1.5 text-xs inline-flex items-center gap-1">
                <X className="size-3" /> Reject
              </button>
            </div>
          </article>
        ))}
        {!items.length && <p className="text-sm text-ink/40">Nothing waiting. Nice.</p>}
      </div>
    </section>
  );
}

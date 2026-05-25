import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { ShieldCheck, Clock, XCircle, FileText, PlaySquare } from "lucide-react";
import {
  getMyApplication, applyAsExpert, getMyRoles,
  expertSubmitArticle, expertSubmitReel, expertMySubmissions,
} from "@/lib/expert.functions";

export const Route = createFileRoute("/_app/expert-portal")({
  head: () => ({ meta: [{ title: "Expert Portal — Nurtura" }] }),
  component: Portal,
});

function Portal() {
  const fetchRoles = useServerFn(getMyRoles);
  const { data: roleData } = useQuery({ queryKey: ["my-roles"], queryFn: () => fetchRoles() });
  const isExpert = roleData?.roles.includes("expert") || roleData?.roles.includes("admin");

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.15em] text-ink/40">For experts</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Expert portal</h1>
        <p className="mt-1 text-sm text-ink/60">
          {isExpert ? "Share your knowledge with Nurtura parents." : "Apply to become a verified Nurtura expert."}
        </p>
      </header>
      {isExpert ? <ExpertWorkspace /> : <ApplicationFlow />}
    </div>
  );
}

function ApplicationFlow() {
  const qc = useQueryClient();
  const getApp = useServerFn(getMyApplication);
  const apply = useServerFn(applyAsExpert);
  const { data } = useQuery({ queryKey: ["my-app"], queryFn: () => getApp() });
  const app = data?.application;

  const [form, setForm] = useState({ full_name: "", title: "", bio: "", credentials: "", specialties: "" });

  useEffect(() => {
    if (app) setForm({
      full_name: app.full_name, title: app.title, bio: app.bio,
      credentials: app.credentials, specialties: (app.specialties ?? []).join(", "),
    });
  }, [app]);

  const m = useMutation({
    mutationFn: () => apply({ data: {
      full_name: form.full_name, title: form.title, bio: form.bio, credentials: form.credentials,
      specialties: form.specialties.split(",").map((s) => s.trim()).filter(Boolean),
    }}),
    onSuccess: () => { toast.success("Application submitted"); qc.invalidateQueries({ queryKey: ["my-app"] }); },
    onError: (e: any) => toast.error(e?.message ?? "Could not submit"),
  });

  if (app && app.status !== "pending") {
    return (
      <div className="rounded-3xl bg-white p-6 ring-1 ring-zinc-950/5 space-y-3">
        {app.status === "approved" ? (
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
            <ShieldCheck className="size-4" /> Approved
          </p>
        ) : (
          <p className="flex items-center gap-2 text-sm font-medium text-rose-700">
            <XCircle className="size-4" /> Not approved
          </p>
        )}
        {app.review_notes && <p className="text-sm text-ink/70">{app.review_notes}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-white p-6 ring-1 ring-zinc-950/5 space-y-4">
      {app?.status === "pending" && (
        <p className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-full px-3 py-1.5 w-fit">
          <Clock className="size-3" /> Under review
        </p>
      )}
      <Field label="Full name"><Input value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} /></Field>
      <Field label="Professional title"><Input placeholder="e.g. Pediatrician, IBCLC" value={form.title} onChange={(v) => setForm({ ...form, title: v })} /></Field>
      <Field label="Short bio (20-2000 chars)"><Textarea rows={4} value={form.bio} onChange={(v) => setForm({ ...form, bio: v })} /></Field>
      <Field label="Credentials (license #, institution, etc.)"><Textarea rows={3} value={form.credentials} onChange={(v) => setForm({ ...form, credentials: v })} /></Field>
      <Field label="Specialties (comma separated)"><Input placeholder="sleep, feeding, NICU" value={form.specialties} onChange={(v) => setForm({ ...form, specialties: v })} /></Field>
      <button disabled={m.isPending} onClick={() => m.mutate()}
        className="rounded-full bg-ink text-cream px-5 py-2.5 text-sm font-medium disabled:opacity-40">
        {m.isPending ? "Submitting…" : app ? "Update application" : "Submit application"}
      </button>
    </div>
  );
}

function ExpertWorkspace() {
  const qc = useQueryClient();
  const fetchMine = useServerFn(expertMySubmissions);
  const subArticle = useServerFn(expertSubmitArticle);
  const subReel = useServerFn(expertSubmitReel);
  const { data: mine } = useQuery({ queryKey: ["my-subs"], queryFn: () => fetchMine() });

  const [tab, setTab] = useState<"article" | "reel">("article");
  const [a, setA] = useState({ slug: "", title: "", excerpt: "", body: "", category: "general", read_minutes: 4 });
  const [r, setR] = useState({ title: "", description: "", category: "general", duration_seconds: 60, expert_name: "" });

  const articleM = useMutation({
    mutationFn: () => subArticle({ data: { ...a, read_minutes: Number(a.read_minutes) } }),
    onSuccess: () => { toast.success("Article submitted for review"); qc.invalidateQueries({ queryKey: ["my-subs"] });
      setA({ slug: "", title: "", excerpt: "", body: "", category: "general", read_minutes: 4 }); },
    onError: (e: any) => toast.error(e?.message ?? "Could not submit"),
  });
  const reelM = useMutation({
    mutationFn: () => subReel({ data: { ...r, duration_seconds: Number(r.duration_seconds) } }),
    onSuccess: () => { toast.success("Reel submitted for review"); qc.invalidateQueries({ queryKey: ["my-subs"] });
      setR({ title: "", description: "", category: "general", duration_seconds: 60, expert_name: "" }); },
    onError: (e: any) => toast.error(e?.message ?? "Could not submit"),
  });

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <button onClick={() => setTab("article")} className={`rounded-full px-4 py-2 text-xs font-medium ${tab === "article" ? "bg-ink text-cream" : "bg-white ring-1 ring-zinc-950/5"}`}>
          <FileText className="inline size-3.5 mr-1" /> Article
        </button>
        <button onClick={() => setTab("reel")} className={`rounded-full px-4 py-2 text-xs font-medium ${tab === "reel" ? "bg-ink text-cream" : "bg-white ring-1 ring-zinc-950/5"}`}>
          <PlaySquare className="inline size-3.5 mr-1" /> Reel
        </button>
      </div>

      {tab === "article" ? (
        <div className="rounded-3xl bg-white p-6 ring-1 ring-zinc-950/5 space-y-4">
          <Field label="Slug (lowercase, hyphens)"><Input value={a.slug} onChange={(v) => setA({ ...a, slug: v })} /></Field>
          <Field label="Title"><Input value={a.title} onChange={(v) => setA({ ...a, title: v })} /></Field>
          <Field label="Excerpt"><Input value={a.excerpt} onChange={(v) => setA({ ...a, excerpt: v })} /></Field>
          <Field label="Category"><Input value={a.category} onChange={(v) => setA({ ...a, category: v })} /></Field>
          <Field label="Read minutes"><Input type="number" value={String(a.read_minutes)} onChange={(v) => setA({ ...a, read_minutes: Number(v) })} /></Field>
          <Field label="Body (markdown ok, 50+ chars)"><Textarea rows={8} value={a.body} onChange={(v) => setA({ ...a, body: v })} /></Field>
          <button disabled={articleM.isPending} onClick={() => articleM.mutate()}
            className="rounded-full bg-ink text-cream px-5 py-2.5 text-sm font-medium disabled:opacity-40">
            {articleM.isPending ? "Submitting…" : "Submit for review"}
          </button>
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-6 ring-1 ring-zinc-950/5 space-y-4">
          <Field label="Title"><Input value={r.title} onChange={(v) => setR({ ...r, title: v })} /></Field>
          <Field label="Description"><Textarea rows={3} value={r.description} onChange={(v) => setR({ ...r, description: v })} /></Field>
          <Field label="Category"><Input value={r.category} onChange={(v) => setR({ ...r, category: v })} /></Field>
          <Field label="Duration (seconds)"><Input type="number" value={String(r.duration_seconds)} onChange={(v) => setR({ ...r, duration_seconds: Number(v) })} /></Field>
          <Field label="Display name"><Input value={r.expert_name} onChange={(v) => setR({ ...r, expert_name: v })} /></Field>
          <button disabled={reelM.isPending} onClick={() => reelM.mutate()}
            className="rounded-full bg-ink text-cream px-5 py-2.5 text-sm font-medium disabled:opacity-40">
            {reelM.isPending ? "Submitting…" : "Submit for review"}
          </button>
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-xs uppercase tracking-wider text-ink/40">My submissions</h2>
        {[...(mine?.articles ?? []).map((x: any) => ({ ...x, kind: "Article" })),
          ...(mine?.reels ?? []).map((x: any) => ({ ...x, kind: "Reel" }))]
          .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
          .map((x: any) => (
            <div key={x.kind + x.id} className="rounded-2xl bg-white p-3 ring-1 ring-zinc-950/5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{x.title}</p>
                <p className="text-[10px] text-ink/40">{x.kind}</p>
              </div>
              <StatusPill status={x.moderation_status} />
            </div>
          ))}
        <Link to="/profile" className="text-xs text-ink/50 underline">Back to profile</Link>
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    rejected: "bg-rose-100 text-rose-700",
    hidden: "bg-zinc-200 text-zinc-700",
  };
  return <span className={`text-[10px] rounded-full px-2 py-0.5 ${map[status] ?? "bg-zinc-100"}`}>{status}</span>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-xs text-ink/60">{label}</span>{children}</label>;
}
function Input(props: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return <input type={props.type ?? "text"} value={props.value} placeholder={props.placeholder}
    onChange={(e) => props.onChange(e.target.value)}
    className="w-full bg-cream rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ink/10" />;
}
function Textarea(props: { value: string; onChange: (v: string) => void; rows?: number }) {
  return <textarea rows={props.rows ?? 4} value={props.value}
    onChange={(e) => props.onChange(e.target.value)}
    className="w-full bg-cream rounded-2xl px-4 py-2.5 text-sm outline-none resize-none focus:ring-2 focus:ring-ink/10" />;
}

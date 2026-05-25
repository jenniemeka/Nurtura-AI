import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Bell } from "lucide-react";
import { listNotifications, markNotificationsRead } from "@/lib/community.functions";

export const Route = createFileRoute("/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Nurtura" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const fetch = useServerFn(listNotifications);
  const mark = useServerFn(markNotificationsRead);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["notifications"], queryFn: () => fetch() });
  const m = useMutation({ mutationFn: () => mark(), onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }) });

  useEffect(() => { m.mutate(); }, []); // eslint-disable-line

  const list = data?.notifications ?? [];

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs uppercase tracking-[0.15em] text-ink/40">Inbox</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Notifications</h1>
      </header>

      <div className="space-y-2">
        {list.map((n: any) => (
          <div key={n.id} className={`rounded-2xl p-4 ring-1 ring-zinc-950/5 ${n.read ? "bg-white" : "bg-lavender/60"}`}>
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-full bg-cream grid place-items-center shrink-0">
                <Bell className="size-4 text-ink/60" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{n.title}</p>
                {n.body && <p className="mt-0.5 text-xs text-ink/60">{n.body}</p>}
                <p className="mt-1 text-[10px] text-ink/40">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        ))}
        {!list.length && (
          <div className="rounded-3xl bg-white p-8 ring-1 ring-zinc-950/5 text-center">
            <p className="text-sm text-ink/50">You're all caught up.</p>
            <Link to="/dashboard" className="mt-3 inline-flex text-xs text-ink/70 underline">Back to home</Link>
          </div>
        )}
      </div>
    </div>
  );
}

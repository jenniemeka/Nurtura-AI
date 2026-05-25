import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, MessageCircle, Heart, Plus, EyeOff } from "lucide-react";
import { getGroup, joinGroup, createPost } from "@/lib/community.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/community/$slug")({
  head: () => ({ meta: [{ title: "Group — Nurtura" }] }),
  component: GroupPage,
});

function GroupPage() {
  const { slug } = Route.useParams();
  const qc = useQueryClient();
  const fetchGroup = useServerFn(getGroup);
  const join = useServerFn(joinGroup);
  const post = useServerFn(createPost);
  const { data } = useQuery({ queryKey: ["group", slug], queryFn: () => fetchGroup({ data: { slug } }) });

  const [showCompose, setShowCompose] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [anon, setAnon] = useState(false);

  const group = data?.group;
  const posts = data?.posts ?? [];

  const joinM = useMutation({
    mutationFn: () => join({ data: { groupId: group!.id } }),
    onSuccess: () => { toast.success("Joined!"); qc.invalidateQueries({ queryKey: ["group", slug] }); },
    onError: () => toast.error("Already a member or sign-in required."),
  });

  const postM = useMutation({
    mutationFn: () => post({ data: { groupId: group!.id, title, body, anonymous: anon } }),
    onSuccess: () => {
      toast.success("Posted");
      setTitle(""); setBody(""); setAnon(false); setShowCompose(false);
      qc.invalidateQueries({ queryKey: ["group", slug] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not post"),
  });

  if (!group) return <p className="text-sm text-ink/40">Loading…</p>;

  return (
    <div className="space-y-5">
      <Link to="/community" className="inline-flex items-center gap-1 text-xs text-ink/60">
        <ArrowLeft className="size-3" /> All groups
      </Link>

      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{group.name}</h1>
        <p className="mt-1 text-sm text-ink/60">{group.description}</p>
        <div className="mt-3 flex gap-2">
          <button onClick={() => joinM.mutate()} className="rounded-full bg-ink text-cream px-4 py-2 text-xs font-medium">
            Join group
          </button>
          <button onClick={() => setShowCompose((s) => !s)} className="rounded-full bg-lavender text-ink px-4 py-2 text-xs font-medium inline-flex items-center gap-1">
            <Plus className="size-3.5" /> New post
          </button>
        </div>
      </header>

      {showCompose && (
        <div className="rounded-3xl bg-white p-4 ring-1 ring-zinc-950/5 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title"
            className="w-full bg-cream rounded-2xl px-4 py-2.5 text-sm outline-none" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share what's on your mind…" rows={4}
            className="w-full bg-cream rounded-2xl px-4 py-2.5 text-sm outline-none resize-none" />
          <div className="flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-xs text-ink/60">
              <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} />
              <EyeOff className="size-3.5" /> Post anonymously
            </label>
            <button disabled={postM.isPending || !title.trim() || !body.trim()}
              onClick={() => postM.mutate()}
              className="rounded-full bg-ink text-cream px-4 py-2 text-xs font-medium disabled:opacity-40">
              {postM.isPending ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      )}

      <section className="space-y-3">
        {posts.map((p: any) => (
          <article key={p.id} className="rounded-3xl bg-white p-5 ring-1 ring-zinc-950/5">
            <div className="flex items-center gap-2 text-[11px] text-ink/50">
              <span>{p.anonymous ? "Anonymous parent" : (p.author_name ?? "A parent")}</span>
              <span>•</span>
              <span>{new Date(p.created_at).toLocaleDateString()}</span>
            </div>
            <h3 className="mt-2 font-medium">{p.title}</h3>
            <p className="mt-1 text-sm text-ink/70 whitespace-pre-wrap line-clamp-6">{p.body}</p>
            <div className="mt-3 flex gap-4 text-xs text-ink/50">
              <span className="inline-flex items-center gap-1"><Heart className="size-3.5" /> {p.likes_count}</span>
              <span className="inline-flex items-center gap-1"><MessageCircle className="size-3.5" /> {p.comments_count}</span>
            </div>
          </article>
        ))}
        {!posts.length && <p className="text-sm text-ink/40">Be the first to post here.</p>}
      </section>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { askAi, suggestPrompts } from "@/lib/ai.functions";
import { getMe } from "@/lib/profile.functions";

export const Route = createFileRoute("/_app/ai")({
  head: () => ({ meta: [{ title: "AI Assistant — Nurtura" }] }),
  component: AiChat;
});

type Msg = { role: "user" | "assistant"; content: string };

function babyMonths(b?: { birth_date?: string | null; pregnancy_due_date?: string | null; is_pregnancy?: boolean }) {
  if (!b) return undefined;
  if (b.is_pregnancy) return -1;
  if (!b.birth_date) return undefined;
  return (Date.now() - new Date(b.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
}

function AiChat() {
  const ask = useServerFn(askAi);
  const fetchMe = useServerFn(getMe);
  const fetchPrompts = useServerFn(suggestPrompts);

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => fetchMe() });
  const months = babyMonths(me?.babies?.[0]);
  const { data: pData } = useQuery({
    queryKey: ["prompts", months],
    queryFn: () => fetchPrompts({ data: { babyAgeMonths: months } }),
  });

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [convoId, setConvoId] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  async function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: t }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const r = await ask({ data: { conversationId: convoId, messages: next } });
      if (r.error) toast.error(r.error);
      if (r.conversationId) setConvoId(r.conversationId);
      if (r.reply) setMessages((m) => [...m, { role: "assistant", content: r.reply! }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 min-h-[calc(100vh-200px)]">
      <div>
        <p className="text-xs uppercase tracking-[0.15em] text-ink/40">Nurtura AI</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Ask anything, gently.</h1>
        <p className="mt-1 text-sm text-ink/60">I offer educational guidance, not medical diagnosis. For anything urgent, please contact your pediatrician.</p>
      </div>

      {messages.length === 0 && (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.15em] text-ink/40 mt-2">Suggested</p>
          {(pData?.prompts ?? []).map((p) => (
            <button key={p} onClick={() => send(p)} className="w-full text-left rounded-2xl bg-card p-4 ring-1 ring-zinc-950/5 hover:shadow-sm transition-shadow text-sm">
              <Sparkles className="size-4 inline mr-2 text-ink/40" />{p}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${m.role === "user" ? "ml-auto bg-ink text-cream" : "bg-card ring-1 ring-zinc-950/5"}`}>
            {m.content}
          </div>
        ))}
        {busy && <div className="bg-card ring-1 ring-zinc-950/5 rounded-2xl px-4 py-3 text-sm text-ink/50 max-w-[85%]">Thinking gently…</div>}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="sticky bottom-20 flex items-center gap-2 rounded-full bg-card p-1.5 pl-4 ring-1 ring-zinc-950/10"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about sleep, feeding, milestones…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink/40"
          maxLength={2000}
        />
        <button disabled={busy || !input.trim()} className="size-9 rounded-full bg-ink grid place-items-center text-cream disabled:opacity-40">
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}

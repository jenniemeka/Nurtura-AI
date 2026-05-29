import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Send, Sparkles, Phone, Siren } from "lucide-react";
import { toast } from "sonner";
import { askAi, suggestPrompts, type ClinicianGuidance } from "@/lib/ai.functions";
import { getMe } from "@/lib/profile.functions";

export const Route = createFileRoute("/_app/ai")({
  head: () => ({ meta: [{ title: "AI Assistant — Nurtura" }] }),
  component: AiChat,
});

type Msg = { role: "user" | "assistant"; content: string; guidance?: ClinicianGuidance | null };

function ClinicianCard({ g }: { g: ClinicianGuidance }) {
  return (
    <div className="mt-2 rounded-2xl bg-lavender/50 p-4 ring-1 ring-zinc-950/5 text-xs space-y-3">
      <p className="text-[10px] uppercase tracking-[0.15em] text-ink/50">
        Clinician guidance · week {g.week} · trimester {g.trimester}
      </p>
      <div>
        <p className="flex items-center gap-1.5 font-medium text-ink">
          <Phone className="size-3.5" /> Call your clinician if you have:
        </p>
        <ul className="mt-1.5 space-y-1 list-disc list-inside text-ink/75">
          {g.callClinician.map((x, i) => <li key={i}>{x}</li>)}
        </ul>
      </div>
      <div>
        <p className="flex items-center gap-1.5 font-medium text-rose-800">
          <Siren className="size-3.5" /> Go to L&amp;D or the ER for:
        </p>
        <ul className="mt-1.5 space-y-1 list-disc list-inside text-rose-900/80">
          {g.goToER.map((x, i) => <li key={i}>{x}</li>)}
        </ul>
      </div>
      <p className="text-ink/55 italic">{g.reminder}</p>
    </div>
  );
}

function AiChat() {
  const ask = useServerFn(askAi);
  const fetchMe = useServerFn(getMe);
  const fetchPrompts = useServerFn(suggestPrompts);

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => fetchMe() });
  const { data: pData } = useQuery({
    queryKey: ["prompts"],
    queryFn: () => fetchPrompts(),
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
      const r = await ask({ data: { conversationId: convoId, messages: next.map(({ role, content }) => ({ role, content })) } });
      if (r.error) toast.error(r.error);
      if (r.conversationId) setConvoId(r.conversationId);
      if (r.reply) setMessages((m) => [...m, { role: "assistant", content: r.reply!, guidance: r.guidance ?? null }]);
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
          <div key={i} className={m.role === "user" ? "ml-auto max-w-[85%]" : "max-w-[85%]"}>
            <div className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-ink text-cream" : "bg-card ring-1 ring-zinc-950/5"}`}>
              {m.content}
            </div>
            {m.role === "assistant" && m.guidance && <ClinicianCard g={m.guidance} />}
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

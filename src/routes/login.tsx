import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { explainAuthError, type AuthHint } from "@/lib/auth-errors";
import { AuthAlert } from "@/components/auth-alert";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — Nurtura" }, { name: "description", content: "Welcome back to Nurtura." }] }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<AuthHint | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setHint(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setHint(explainAuthError(error.message, "login"));
      return;
    }
    nav({ to: "/dashboard" });
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (r?.error) {
      setHint(explainAuthError(r.error.message, "login"));
      toast.error(r.error.message);
    }
  }

  return (
    <AuthShell title="Welcome back" sub="Pick up where you left off.">
      <button onClick={google} className="mb-4 w-full rounded-full bg-card px-5 py-3 text-sm font-medium ring-1 ring-zinc-950/10 hover:bg-zinc-50">
        Continue with Google
      </button>
      <Divider />
      <AuthAlert hint={hint} email={email} onResent={() => setHint(null)} />
      <form onSubmit={onSubmit} className="space-y-3">
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        <button disabled={loading} className="w-full rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream disabled:opacity-50">
          {loading ? "Signing in…" : "Log in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-ink/60">
        New here? <Link to="/signup" className="font-medium text-ink underline underline-offset-4">Create an account</Link>
      </p>
    </AuthShell>
  );
}


export function AuthShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <header className="px-6 py-5">
        <Link to="/" className="text-lg font-semibold tracking-tight">Nurtura</Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-ink/60">{sub}</p>
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="w-full rounded-2xl bg-card px-4 py-3 text-sm ring-1 ring-zinc-950/10 placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-ink/30" />;
}

export function Divider() {
  return (
    <div className="my-4 flex items-center gap-3 text-xs text-ink/40">
      <div className="h-px flex-1 bg-zinc-200" /> or <div className="h-px flex-1 bg-zinc-200" />
    </div>
  );
}

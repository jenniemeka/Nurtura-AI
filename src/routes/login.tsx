import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { explainAuthError, type AuthHint } from "@/lib/auth-errors";
import { AuthAlert } from "@/components/auth-alert";
import { AuthShell, Divider, Input } from "@/components/auth-shell";
import { resolvePostAuthRoute } from "@/lib/post-auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — Nurtura" }, { name: "description", content: "Welcome back to Nurtura." }] }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const hydrated = useHydrated();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<AuthHint | null>(null);
  const busy = !hydrated || loading;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setHint(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setLoading(false);
      setHint(explainAuthError(error?.message ?? "Login failed", "login"));
      return;
    }
    const to = await resolvePostAuthRoute(data.user.id);
    setLoading(false);
    nav({ to, replace: true });
  }

  async function google() {
    if (!hydrated) return;
    setLoading(true);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    setLoading(false);
    if (r?.error) {
      setHint(explainAuthError(r.error.message, "login"));
      toast.error(r.error.message);
      return;
    }
    if (!r?.redirected) {
      const { data } = await supabase.auth.getUser();
      if (data.user) nav({ to: await resolvePostAuthRoute(data.user.id), replace: true });
    }
  }

  return (
    <AuthShell title="Welcome back" sub="Pick up where you left off.">
      <button type="button" onClick={google} disabled={busy} className="mb-4 w-full rounded-full bg-card px-5 py-3 text-sm font-medium ring-1 ring-zinc-950/10 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50">
        Continue with Google
      </button>
      <Divider />
      <AuthAlert hint={hint} email={email} onResent={() => setHint(null)} />
      <form onSubmit={onSubmit} className="space-y-3">
        <Input disabled={busy} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input disabled={busy} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-ink/60 underline underline-offset-4 hover:text-ink">
            Forgot password?
          </Link>
        </div>
        <button disabled={busy} className="w-full rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? "Signing in…" : "Log in"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-ink/60">
        New here? <Link to="/signup" className="font-medium text-ink underline underline-offset-4">Create an account</Link>
      </p>
    </AuthShell>
  );
}

function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

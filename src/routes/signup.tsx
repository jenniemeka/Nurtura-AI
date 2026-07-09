import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { AuthShell, Input, Divider } from "@/components/auth-shell";
import { explainAuthError, signupVerificationHint, type AuthHint } from "@/lib/auth-errors";
import { AuthAlert } from "@/components/auth-alert";
import { resolvePostAuthRoute } from "@/lib/post-auth";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — Nurtura" }, { name: "description", content: "Start your parenting journey with Nurtura." }] }),
  component: Signup,
});

function Signup() {
  const nav = useNavigate();
  const hydrated = useHydrated();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<AuthHint | null>(null);
  const busy = !hydrated || loading;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setHint(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/onboarding",
        data: { parent_name: name },
      },
    });
    if (error) {
      setLoading(false);
      setHint(explainAuthError(error.message, "signup"));
      return;
    }
    // Session present → auto-confirm on. Otherwise verification needed.
    if (data.session && data.user) {
      // Wait a beat so the session is fully persisted before RLS-guarded reads.
      const to = await resolvePostAuthRoute(data.user.id);
      setLoading(false);
      nav({ to, replace: true });
    } else {
      setLoading(false);
      setHint(signupVerificationHint(true));
    }
  }

  async function google() {
    if (!hydrated) return;
    setLoading(true);
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    setLoading(false);
    if (r?.error) {
      setHint(explainAuthError(r.error.message, "signup"));
      return;
    }
    if (!r?.redirected) {
      const { data } = await supabase.auth.getUser();
      if (data.user) nav({ to: await resolvePostAuthRoute(data.user.id), replace: true });
    }
  }

  return (
    <AuthShell title="Create your account" sub="A calmer, more confident parenting journey starts here.">
      <button type="button" onClick={google} disabled={busy} className="mb-4 w-full rounded-full bg-card px-5 py-3 text-sm font-medium ring-1 ring-zinc-950/10 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50">
        Continue with Google
      </button>
      <Divider />
      <AuthAlert hint={hint} email={email} onResent={() => setHint(null)} />
      <form onSubmit={onSubmit} className="space-y-3">
        <Input disabled={busy} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
        <Input disabled={busy} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input disabled={busy} type="password" placeholder="Password (8+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        <button disabled={busy} className="w-full rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-ink/60">
        Already have an account? <Link to="/login" className="font-medium text-ink underline underline-offset-4">Log in</Link>
      </p>
    </AuthShell>
  );
}

function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

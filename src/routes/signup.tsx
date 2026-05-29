import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { AuthShell, Input, Divider } from "./login";
import { explainAuthError, signupVerificationHint, type AuthHint } from "@/lib/auth-errors";
import { AuthAlert } from "@/components/auth-alert";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Sign up — Nurtura" }, { name: "description", content: "Start your parenting journey with Nurtura." }] }),
  component: Signup,
});

function Signup() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<AuthHint | null>(null);

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
    setLoading(false);
    if (error) {
      setHint(explainAuthError(error.message, "signup"));
      return;
    }
    // If session is present, auto-confirm is on — proceed. Otherwise show verification hint.
    if (data.session) {
      nav({ to: "/onboarding" });
    } else {
      setHint(signupVerificationHint(true));
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/onboarding" });
    if (r?.error) setHint(explainAuthError(r.error.message, "signup"));
  }

  return (
    <AuthShell title="Create your account" sub="A calmer, more confident parenting journey starts here.">
      <button onClick={google} className="mb-4 w-full rounded-full bg-card px-5 py-3 text-sm font-medium ring-1 ring-zinc-950/10 hover:bg-zinc-50">
        Continue with Google
      </button>
      <Divider />
      <AuthAlert hint={hint} email={email} onResent={() => setHint(null)} />
      <form onSubmit={onSubmit} className="space-y-3">
        <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        <button disabled={loading} className="w-full rounded-full bg-ink px-5 py-3 text-sm font-medium text-cream disabled:opacity-50">
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-ink/60">
        Already have an account? <Link to="/login" className="font-medium text-ink underline underline-offset-4">Log in</Link>
      </p>
    </AuthShell>
  );
}

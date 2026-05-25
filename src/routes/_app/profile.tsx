import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { LogOut, ShieldCheck, Users, Sparkles, ShieldAlert, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getMe } from "@/lib/profile.functions";
import { getMyRoles } from "@/lib/expert.functions";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — Nurtura" }] }),
  component: Profile,
});

function Profile() {
  const { user } = useAuth();
  const nav = useNavigate();
  const fetchMe = useServerFn(getMe);
  const fetchRoles = useServerFn(getMyRoles);
  const { data } = useQuery({ queryKey: ["me"], queryFn: () => fetchMe() });
  const { data: roleData } = useQuery({ queryKey: ["my-roles"], queryFn: () => fetchRoles() });
  const roles = roleData?.roles ?? [];
  const isExpert = roles.includes("expert");
  const isAdmin = roles.includes("admin");

  async function signOut() {
    await supabase.auth.signOut();
    nav({ to: "/" });
  }

  const baby = data?.babies?.[0];
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.15em] text-ink/40">Profile</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">{data?.profile?.parent_name ?? "Welcome"}</h1>
        <p className="text-sm text-ink/60 mt-1">{user?.email}</p>
      </div>

      {baby && (
        <div className="rounded-2xl bg-card p-5 ring-1 ring-zinc-950/5">
          <p className="text-xs uppercase tracking-[0.15em] text-ink/40">Your baby</p>
          <p className="mt-1 font-medium">{baby.name}</p>
          <p className="text-sm text-ink/60">
            {baby.is_pregnancy ? `Due ${baby.pregnancy_due_date}` : `Born ${baby.birth_date}`}
          </p>
        </div>
      )}

      {data?.profile?.concerns && data.profile.concerns.length > 0 && (
        <div className="rounded-2xl bg-card p-5 ring-1 ring-zinc-950/5">
          <p className="text-xs uppercase tracking-[0.15em] text-ink/40 mb-2">Top concerns</p>
          <div className="flex flex-wrap gap-2">
            {data.profile.concerns.map((c) => (
              <span key={c} className="rounded-full bg-lavender px-3 py-1 text-xs">{c}</span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <NavCard to="/experts" icon={ShieldCheck} title="Verified experts" desc="Pediatricians, IBCLCs, sleep coaches." />
        <NavCard to="/expert-portal" icon={Sparkles} title={isExpert ? "Expert workspace" : "Become an expert"} desc={isExpert ? "Publish articles and reels." : "Apply to share your expertise."} />
        {isAdmin && <NavCard to="/admin" icon={ShieldAlert} title="Admin moderation" desc="Review applications and content." />}
      </div>

      <button onClick={signOut} className="w-full rounded-2xl bg-card p-4 ring-1 ring-zinc-950/5 text-left flex items-center gap-3 text-sm font-medium">
        <LogOut className="size-4" /> Sign out
      </button>
    </div>
  );
}

function NavCard({ to, icon: Icon, title, desc }: { to: string; icon: any; title: string; desc: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-zinc-950/5 hover:ring-ink/10 transition">
      <div className="size-9 rounded-full bg-lavender grid place-items-center"><Icon className="size-4 text-ink/70" /></div>
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-ink/50">{desc}</p>
      </div>
      <ArrowRight className="size-4 text-ink/30" />
    </Link>
  );
}

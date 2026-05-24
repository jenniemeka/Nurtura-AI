import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { Home, MessageCircle, ListChecks, BookOpen, User } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const TABS = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/tracker", label: "Tracker", icon: ListChecks },
  { to: "/ai", label: "AI", icon: MessageCircle },
  { to: "/learn", label: "Learn", icon: BookOpen },
  { to: "/profile", label: "Profile", icon: User },
] as const;

function AppLayout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  if (loading || !user) {
    return <div className="min-h-screen bg-cream grid place-items-center text-sm text-ink/50">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-cream pb-24">
      <header className="sticky top-0 z-40 bg-cream/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <Link to="/dashboard" className="text-base font-semibold tracking-tight">Nurtura</Link>
          <Link to="/profile" className="rounded-full bg-lavender size-8 grid place-items-center text-xs font-medium">
            {(user.email ?? "?").charAt(0).toUpperCase()}
          </Link>
        </div>
        <div className="h-px w-full bg-zinc-950/5" />
      </header>
      <main className="mx-auto max-w-3xl px-5 py-6 animate-fade-in">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-cream/95 backdrop-blur-md border-t border-zinc-950/5">
        <div className="mx-auto flex max-w-3xl items-stretch justify-around px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {TABS.map(({ to, label, icon: Icon }) => {
            const active = loc.pathname.startsWith(to);
            return (
              <Link key={to} to={to} className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[10px] font-medium transition-colors ${active ? "text-ink" : "text-ink/40"}`}>
                <Icon className={`size-5 ${active ? "" : "opacity-70"}`} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

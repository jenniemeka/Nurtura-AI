import { Link } from "@tanstack/react-router";

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
  return <input {...props} className="w-full rounded-2xl bg-card px-4 py-3 text-sm ring-1 ring-zinc-950/10 placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-ink/30 disabled:cursor-not-allowed disabled:opacity-50" />;
}

export function Divider() {
  return (
    <div className="my-4 flex items-center gap-3 text-xs text-ink/40">
      <div className="h-px flex-1 bg-zinc-200" /> or <div className="h-px flex-1 bg-zinc-200" />
    </div>
  );
}
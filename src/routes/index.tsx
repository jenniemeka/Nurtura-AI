import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Play, ArrowRight, Baby, Moon, Apple, HeartHandshake, MessageCircle } from "lucide-react";

import reelSleep from "@/assets/reel-sleep.jpg";
import reelMassage from "@/assets/reel-massage.jpg";
import reelPlay from "@/assets/reel-play.jpg";
import expert1 from "@/assets/expert-1.jpg";
import expert2 from "@/assets/expert-2.jpg";
import expert3 from "@/assets/expert-3.jpg";
import ogLanding from "@/assets/og-landing.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nurtura AI — Confident parenting starts with quiet moments" },
      { name: "description", content: "Personalized infant wellness guidance, milestone tracking, and a gentle AI assistant. Built for parents who value clarity over noise." },
      { property: "og:title", content: "Nurtura AI" },
      { property: "og:description", content: "Your AI-powered parenting companion." },
      { property: "og:image", content: ogLanding },
      { name: "twitter:image", content: ogLanding },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-cream text-ink antialiased">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full bg-cream/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="text-lg font-semibold tracking-tight">Nurtura</Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-ink/70 hover:text-ink transition-colors">Log in</Link>
            <Link to="/signup" className="inline-flex items-center rounded-full bg-ink px-5 py-2 text-sm font-medium text-cream hover:bg-ink/90 transition-colors">
              Join Nurtura
            </Link>
          </div>
        </div>
        <div className="h-px w-full bg-zinc-950/5" />
      </nav>

      <main className="pt-16">
        {/* Hero */}
        <section className="px-6 py-16 lg:py-24">
          <div className="mx-auto max-w-7xl flex flex-col items-center text-center animate-fade-in">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-lavender px-3 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-950/5">
              <Sparkles className="size-3" /> Your AI parenting partner
            </span>
            <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl max-w-[20ch]">
              Confident parenting starts with quiet moments
            </h1>
            <p className="mt-6 text-pretty text-base text-ink/60 sm:text-lg max-w-[56ch]">
              Personalized infant wellness guidance and development tracking powered by gentle AI. Built for parents who value clarity over noise.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link to="/signup" className="inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream hover:bg-zinc-800 transition-colors">
                Get Started <ArrowRight className="ml-2 size-4" />
              </Link>
              <Link to="/signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-100 px-5 py-3 text-sm font-medium text-ink hover:bg-zinc-200 transition-colors">
                <MessageCircle className="size-4" /> Ask Nurtura AI
              </Link>
              <a href="#trending" className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 px-5 py-3 text-sm font-medium text-ink/70 hover:bg-zinc-50 transition-colors">
                <Play className="size-4" /> Watch tips
              </a>
            </div>
          </div>
        </section>

        {/* Reels */}
        <section id="trending" className="bg-sky/30 py-16">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-8 flex items-end justify-between">
              <h2 className="text-balance text-2xl font-semibold tracking-tight max-w-[40ch]">Trending guidance</h2>
              <Link to="/learn" className="text-sm font-medium text-ink/60 underline decoration-zinc-950/10 underline-offset-4">View all</Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {[
                { src: reelSleep, label: "Sleep Safety", title: "Gentle sleep transitions" },
                { src: reelMassage, label: "Wellness", title: "Massage for digestion" },
                { src: reelPlay, label: "Playtime", title: "Sensory development" },
              ].map((r) => (
                <div key={r.title} className="min-w-[260px] shrink-0">
                  <div className="aspect-[9/16] w-full overflow-hidden rounded-2xl ring-1 ring-zinc-950/5 mb-3">
                    <img src={r.src} alt={r.title} loading="lazy" className="h-full w-full object-cover" />
                  </div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-zinc-500">{r.label}</p>
                  <p className="text-sm font-medium mt-1">{r.title}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Milestones + AI Preview */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
              <div>
                <h2 className="mb-8 text-2xl font-semibold tracking-tight">Recent milestones</h2>
                <div className="space-y-4">
                  {[
                    { color: "bg-sage", title: "First social smile", sub: "Reached at 8 weeks • Expected range", icon: HeartHandshake },
                    { color: "bg-lavender", title: "Visual tracking", sub: "Following objects across midline", icon: Baby },
                    { color: "bg-sky", title: "First word", sub: "9 months • Within range", icon: Sparkles },
                  ].map(({ color, title, sub, icon: Icon }) => (
                    <div key={title} className="flex items-center justify-between rounded-2xl bg-card p-5 ring-1 ring-zinc-950/5 transition-shadow hover:shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${color}`}>
                          <Icon className="size-5 text-zinc-700" />
                        </div>
                        <div>
                          <p className="font-medium">{title}</p>
                          <p className="text-sm text-ink/50">{sub}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col rounded-3xl bg-zinc-900 p-6 text-cream ring-1 ring-black/5">
                <div className="mb-6 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-lavender/20 flex items-center justify-center">
                    <div className="size-3 bg-lavender rounded-full animate-pulse" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Nurtura Assistant</p>
                    <p className="text-[10px] text-cream/40">Online • Ready to help</p>
                  </div>
                </div>
                <div className="mb-4 flex flex-col gap-3">
                  <div className="self-start rounded-2xl bg-zinc-800 px-4 py-3 text-sm">How can I help today?</div>
                  <div className="self-end rounded-2xl bg-lavender/10 px-4 py-3 text-sm text-lavender">Leo is 4 months. When can we start solids?</div>
                  <div className="self-start rounded-2xl bg-zinc-800 px-4 py-3 text-sm text-pretty">
                    Most pediatric guidelines suggest waiting until around 6 months — look for sitting with support and good head control.
                  </div>
                </div>
                <Link to="/signup" className="mt-auto flex items-center gap-2 rounded-full bg-zinc-800/50 p-1.5 pl-4 ring-1 ring-zinc-700">
                  <span className="text-xs text-cream/40 flex-1 text-left">Type your question…</span>
                  <span className="ml-auto h-8 px-3 rounded-full bg-lavender flex items-center text-ink text-xs font-medium">Try free</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="bg-sage/20 py-20">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="mb-10 text-center text-2xl font-semibold tracking-tight">Explore by topic</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {[
                { name: "Sleep", color: "bg-sky/60", icon: Moon },
                { name: "Nutrition", color: "bg-sage/70", icon: Apple },
                { name: "Development", color: "bg-lavender/70", icon: Sparkles },
                { name: "Self-care", color: "bg-amber-100/70", icon: HeartHandshake },
              ].map(({ name, color, icon: Icon }) => (
                <Link to="/learn" key={name} className="flex flex-col items-center justify-center rounded-3xl bg-card p-8 text-center ring-1 ring-zinc-950/5 hover:shadow-sm transition-shadow">
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${color}`}>
                    <Icon className="size-5 text-ink/70" />
                  </div>
                  <p className="text-sm font-medium">{name}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Experts */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-12">
              <h2 className="text-2xl font-semibold tracking-tight">Guided by experts</h2>
              <p className="mt-2 text-ink/60 text-sm">Pediatricians, lactation consultants, and postpartum specialists.</p>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { src: expert1, name: "Dr. Sarah Chen", role: "Pediatrician & Sleep Specialist" },
                { src: expert2, name: "Marcus Thorne", role: "Child Nutritionist" },
                { src: expert3, name: "Elena Rossi", role: "Postpartum Wellness Coach" },
              ].map((e) => (
                <div key={e.name} className="flex items-center gap-4">
                  <img src={e.src} alt={e.name} loading="lazy" className="h-16 w-16 rounded-full object-cover ring-1 ring-zinc-950/5" />
                  <div>
                    <p className="font-medium">{e.name}</p>
                    <p className="text-sm text-ink/50">{e.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Download CTA */}
        <section className="px-6 pb-24">
          <div className="mx-auto max-w-5xl rounded-[2rem] bg-lavender/50 px-8 py-16 text-center ring-1 ring-zinc-950/5">
            <h2 className="text-3xl font-semibold tracking-tight">The support you deserve</h2>
            <p className="mx-auto mt-4 text-pretty text-ink/60 max-w-[48ch]">
              Join thousands of parents finding clarity in the chaos. Personalized AI guidance, expert content, and milestone tracking — in one calm place.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link to="/signup" className="inline-flex items-center rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream">Start your journey</Link>
              <Link to="/learn" className="inline-flex items-center rounded-full bg-card px-6 py-3 text-sm font-medium ring-1 ring-zinc-950/5">Browse articles</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-950/5 bg-cream py-12">
        <div className="mx-auto max-w-7xl px-6 flex flex-col items-center justify-between gap-6 sm:flex-row">
          <span className="text-lg font-semibold tracking-tight">Nurtura</span>
          <p className="text-sm text-ink/40">© {new Date().getFullYear()} Nurtura AI. Educational guidance, not medical diagnosis.</p>
        </div>
      </footer>
    </div>
  );
}

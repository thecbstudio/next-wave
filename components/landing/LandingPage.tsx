"use client"

import { useRef, useEffect, useState } from "react"
import { motion, useInView, useScroll, useTransform } from "framer-motion"
import Link from "next/link"
import {
  TrendingUp, MessageCircle, BarChart2, GitCompare,
  ArrowRight, Zap, Star, CheckCircle,
} from "lucide-react"

// ─── Design tokens (pally.com inspired) ──────────────────────────────────────

const T = {
  bg:       "#161e29",
  bgAlt:    "#111722",
  text:     "#fefcfb",
  muted:    "rgba(254,252,251,0.58)",
  faint:    "rgba(254,252,251,0.35)",
  border:   "rgba(254,252,251,0.08)",
  card:     "rgba(255,255,255,0.03)",
  purple:   "rgb(95,77,189)",
  purpleHi: "rgb(152,104,204)",
  pink:     "rgb(233,179,242)",
  green:    "#34d399",
  amber:    "#f59e0b",
  blue:     "#60a5fa",
}

// ─── Reusable fade-in section ─────────────────────────────────────────────────

function FadeIn({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </motion.div>
  )
}

// ─── Animated counter (hero mockup) ──────────────────────────────────────────

function Counter({ target, color }: { target: number; color: string }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView) return
    let v = 0; const step = target / 45
    const id = setInterval(() => {
      v += step
      if (v >= target) { setVal(target); clearInterval(id) } else setVal(Math.floor(v))
    }, 18)
    return () => clearInterval(id)
  }, [inView, target])
  return <span ref={ref} style={{ color }}>{val}</span>
}

// ─── Pill button ──────────────────────────────────────────────────────────────

function PillButton({ href, children, filled = false, className = "" }: {
  href: string; children: React.ReactNode; filled?: boolean; className?: string
}) {
  return (
    <Link href={href}>
      <motion.span
        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        className={`inline-flex cursor-pointer items-center gap-2 px-6 py-3 text-sm font-semibold transition-all ${className}`}
        style={{
          borderRadius: 100,
          ...(filled ? {
            background: `linear-gradient(135deg, ${T.purple}, ${T.purpleHi})`,
            color: T.text,
            boxShadow: `0 0 32px rgba(95,77,189,0.35)`,
          } : {
            border: `1.5px solid ${T.border}`,
            color: T.text,
            background: T.card,
            backdropFilter: "blur(8px)",
          })
        }}
      >
        {children}
      </motion.span>
    </Link>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])

  return (
    <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-8 transition-all duration-300"
      style={{
        height: 64,
        background: scrolled ? "rgba(22,30,41,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? `1px solid ${T.border}` : "1px solid transparent",
      }}
    >
      {/* Logo */}
      <Link href="/landing" className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: `linear-gradient(135deg, ${T.purple}, ${T.purpleHi})` }}>
          <TrendingUp className="h-3.5 w-3.5" style={{ color: T.text }} strokeWidth={2.5} />
        </div>
        <span className="text-[15px] font-semibold tracking-tight" style={{ color: T.text }}>TrendPulse</span>
      </Link>

      {/* Nav links */}
      <div className="hidden items-center gap-8 md:flex">
        {["Features", "How it works", "Compare"].map(item => (
          <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`}
            className="text-sm transition-colors hover:opacity-100"
            style={{ color: T.muted }}
          >{item}</a>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex items-center gap-3">
        <Link href="/login" className="text-sm transition-opacity hover:opacity-80" style={{ color: T.muted }}>
          Sign in
        </Link>
        <PillButton href="/login" filled>
          Get started <ArrowRight className="h-3.5 w-3.5" />
        </PillButton>
      </div>
    </nav>
  )
}

// ─── Hero dashboard mockup ────────────────────────────────────────────────────

function HeroMockup() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  const metrics = [
    { label: "Rise Probability",    score: 87, color: T.green  },
    { label: "Current Demand",      score: 74, color: T.amber  },
    { label: "Virality Score",      score: 91, color: T.pink   },
    { label: "Sustained Potential", score: 62, color: T.blue   },
  ]

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 40, rotateX: 8 }}
      animate={inView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
      transition={{ duration: 0.9, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
      style={{ perspective: 1000, transformStyle: "preserve-3d" }}
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl"
        style={{ background: "rgba(22,30,41,0.9)", border: `1px solid ${T.border}`, backdropFilter: "blur(20px)" }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between border-b px-5 py-3.5"
          style={{ borderColor: T.border }}>
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              {["#ff5f57","#febc2e","#28c840"].map(c => (
                <div key={c} className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span className="ml-1 text-[11px]" style={{ color: T.faint }}>Product Analysis</span>
          </div>
          <div className="flex items-center gap-1.5">
            <motion.div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: T.green }}
              animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
            <span className="text-[10px] font-medium" style={{ color: T.green }}>Live</span>
          </div>
        </div>

        <div className="p-5">
          {/* Product header */}
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: T.faint }}>Instant Noodles</p>
              <h3 className="mt-0.5 text-[15px] font-bold leading-tight" style={{ color: T.text }}>
                Buldak Hot Chicken Ramen
              </h3>
            </div>
            <div className="rounded-full px-2.5 py-1 text-[10px] font-bold"
              style={{ background: "rgba(233,179,242,0.12)", color: T.pink }}>
              🔥 Peak Viral
            </div>
          </div>

          {/* Score pills */}
          <div className="mb-5 grid grid-cols-3 gap-2">
            {[
              { label: "Growth",   score: 87, color: T.green },
              { label: "Demand",   score: 74, color: T.amber },
              { label: "Momentum", score: 91, color: T.pink  },
            ].map(({ label, score, color }) => (
              <div key={label} className="flex flex-col items-center rounded-xl py-2.5"
                style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}` }}>
                <span className="text-xl font-bold tabular-nums" style={{ color }}>
                  <Counter target={score} color={color} />
                </span>
                <span className="mt-0.5 text-[10px]" style={{ color: T.faint }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Metric bars */}
          <div className="space-y-3">
            {metrics.map(({ label, score, color }, i) => (
              <div key={label}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px]" style={{ color: T.muted }}>{label}</span>
                  <span className="text-[11px] font-semibold tabular-nums" style={{ color }}>{score}/100</span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <motion.div className="h-full rounded-full" style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    animate={inView ? { width: `${score}%` } : {}}
                    transition={{ duration: 0.9, delay: 0.5 + i * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Summary preview */}
          <div className="mt-4 rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}>
            <p className="text-[10px] leading-relaxed" style={{ color: T.faint }}>
              Buldak Ramen's viral trajectory shows no sign of slowing — driven by Gen Z challenge culture and
              sustained TikTok engagement…
            </p>
            <div className="mt-1.5 flex items-center gap-1">
              <motion.div className="h-2 w-2 rounded-full" style={{ backgroundColor: T.purple }}
                animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} />
              <span className="text-[9px]" style={{ color: T.faint }}>Generating insights</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Brands marquee ───────────────────────────────────────────────────────────

const BRANDS = ["Nestlé", "Unilever", "PepsiCo", "Mondelez", "Red Bull", "Danone", "Kraft Heinz", "Mars Inc.", "Kellogg's", "AB InBev"]

function BrandTicker() {
  return (
    <div className="relative overflow-hidden py-6" style={{ borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
      <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.15em]" style={{ color: T.faint }}>
        Trusted by analysts tracking
      </p>
      <div className="flex overflow-hidden">
        <motion.div
          className="flex shrink-0 items-center gap-12"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
        >
          {[...BRANDS, ...BRANDS].map((brand, i) => (
            <span key={i} className="shrink-0 text-sm font-semibold whitespace-nowrap"
              style={{ color: "rgba(254,252,251,0.3)", letterSpacing: "0.05em" }}>
              {brand}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: MessageCircle,
    title: "AI Trend Chat",
    desc: "Ask anything. Get analyst-grade answers about viral food trends, campus behavior, and FMCG signals — powered by Claude Sonnet.",
    accent: T.purple,
    tag: "Natural language",
  },
  {
    icon: BarChart2,
    title: "Product Insights",
    desc: "Drop a product name or upload a photo. Get growth score, demand curve, virality probability, and a streaming expert summary — in 8 seconds.",
    accent: T.pink,
    tag: "Vision-capable",
  },
  {
    icon: GitCompare,
    title: "Head-to-Head Compare",
    desc: "Buldak vs Indomie? Prime vs Gatorade? Pick any two products. We analyze all 12 trend signals simultaneously and show you who wins.",
    accent: T.green,
    tag: "Shareable links",
  },
]

function Features() {
  return (
    <section id="features" className="px-6 py-28 md:px-16">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="mb-16 text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: T.purpleHi }}>
            Platform
          </p>
          <h2 className="text-[40px] font-bold leading-[110%] tracking-tight" style={{ color: T.text }}>
            Everything you need to spot<br />the next big thing
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[17px] leading-relaxed" style={{ color: T.muted }}>
            Three tools. One intelligence layer. Built for food and FMCG professionals who can't afford to be late.
          </p>
        </FadeIn>

        <div className="grid gap-4 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc, accent, tag }, i) => (
            <FadeIn key={title} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -4, borderColor: `${accent}30` }}
                className="group flex h-full flex-col rounded-2xl p-6 transition-all duration-300"
                style={{ background: T.card, border: `1px solid ${T.border}` }}
              >
                {/* Icon */}
                <div className="mb-5 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: `${accent}15` }}>
                    <Icon className="h-5 w-5" style={{ color: accent }} strokeWidth={1.8} />
                  </div>
                  <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
                    style={{ background: `${accent}12`, color: accent }}>
                    {tag}
                  </span>
                </div>

                <h3 className="mb-2.5 text-[17px] font-bold" style={{ color: T.text }}>{title}</h3>
                <p className="flex-1 text-[14px] leading-relaxed" style={{ color: T.muted }}>{desc}</p>

                <div className="mt-5 flex items-center gap-1.5 text-[13px] font-semibold transition-all"
                  style={{ color: accent }}>
                  Try it free <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Product preview section ──────────────────────────────────────────────────

function ProductPreview() {
  const metrics = [
    { label: "Rise Probability",    score: 87, color: T.green },
    { label: "Current Demand",      score: 74, color: T.amber },
    { label: "Engagement Momentum", score: 91, color: T.pink  },
    { label: "Audience Penetration",score: 68, color: T.blue  },
    { label: "Virality Score",      score: 83, color: T.purple },
    { label: "Sustained Potential", score: 55, color: T.faint },
  ]

  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <section className="px-6 py-28 md:px-16" style={{ background: T.bgAlt }}>
      <div className="mx-auto grid max-w-6xl items-center gap-16 md:grid-cols-2">

        {/* Text */}
        <FadeIn>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: T.purpleHi }}>
            Analysis engine
          </p>
          <h2 className="mb-5 text-[38px] font-bold leading-[110%] tracking-tight" style={{ color: T.text }}>
            See the data.<br />
            <span style={{
              background: `linear-gradient(135deg, ${T.pink}, ${T.purpleHi})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Then trust it.
            </span>
          </h2>
          <p className="mb-8 text-[16px] leading-relaxed" style={{ color: T.muted }}>
            Six AI-scored metrics. Real demand curves. An expert summary that streams in word by word while you read the scores. Not a dashboard — an analyst.
          </p>

          <div className="space-y-3.5">
            {[
              "Growth probability, demand curve, and momentum — all at once",
              "Upload a photo and get vision-based analysis instantly",
              "Compare two products with one click — shareable link included",
            ].map(item => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: T.green }} />
                <span className="text-[14px]" style={{ color: T.muted }}>{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <PillButton href="/login" filled>
              Analyze your first product <ArrowRight className="h-3.5 w-3.5" />
            </PillButton>
          </div>
        </FadeIn>

        {/* Metrics card */}
        <FadeIn delay={0.15}>
          <div ref={ref} className="rounded-2xl p-6"
            style={{ background: T.card, border: `1px solid ${T.border}` }}>

            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: T.faint }}>Detailed Analysis</p>
                <p className="mt-0.5 text-[14px] font-semibold" style={{ color: T.text }}>Buldak Hot Chicken Ramen</p>
              </div>
              <div className="rounded-full px-2.5 py-1 text-[10px] font-bold"
                style={{ background: "rgba(233,179,242,0.1)", color: T.pink }}>
                🔥 Peak Viral
              </div>
            </div>

            <div className="space-y-4">
              {metrics.map(({ label, score, color }, i) => (
                <div key={label}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[12px]" style={{ color: T.muted }}>{label}</span>
                    <span className="text-[12px] font-bold tabular-nums" style={{ color }}>{score}/100</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: color }}
                      initial={{ width: 0 }}
                      animate={inView ? { width: `${score}%` } : {}}
                      transition={{ duration: 0.9, delay: 0.1 + i * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Streaming summary */}
            <div className="mt-5 rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${T.border}` }}>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: T.faint }}>Insights Summary</p>
              <p className="text-[12px] leading-relaxed" style={{ color: T.muted }}>
                Buldak Ramen occupies a rare position — both a proven staple and a perpetual viral trigger.
                Its fire noodle challenge roots give it near-permanent cultural relevance among Gen Z,
                while limited-edition flavors sustain search volume peaks...
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <motion.div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: T.purple }}
                  animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 0.9, repeat: Infinity }} />
                <span className="text-[10px]" style={{ color: T.faint }}>Streaming analysis</span>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: "01",
    icon: Zap,
    title: "Type a product or upload a photo",
    desc: "Enter any food or FMCG product by name, or take a photo of a product on a shelf. Claude's vision model reads it instantly.",
  },
  {
    num: "02",
    icon: BarChart2,
    title: "Claude AI scores 6 key trend signals",
    desc: "Growth probability, demand curve, virality, audience penetration, engagement momentum, and sustained potential — all in parallel.",
  },
  {
    num: "03",
    icon: TrendingUp,
    title: "Get your score + streaming expert summary",
    desc: "Results land in under 8 seconds. The analyst summary streams in word by word while you read the numbers above it.",
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-28 md:px-16">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="mb-16 text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: T.purpleHi }}>
            How it works
          </p>
          <h2 className="text-[40px] font-bold leading-[110%] tracking-tight" style={{ color: T.text }}>
            From product to insight<br />in three steps
          </h2>
        </FadeIn>

        <div className="grid gap-5 md:grid-cols-3">
          {STEPS.map(({ num, icon: Icon, title, desc }, i) => (
            <FadeIn key={num} delay={i * 0.12}>
              <div className="relative h-full rounded-2xl p-7"
                style={{ background: T.card, border: `1px solid ${T.border}` }}>
                {/* Step number */}
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-[13px] font-bold" style={{
                    background: `linear-gradient(135deg, ${T.purple}, ${T.pink})`,
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>
                    {num}
                  </span>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: `${T.purple}18` }}>
                    <Icon className="h-4.5 w-4.5" style={{ color: T.purpleHi }} strokeWidth={1.8} />
                  </div>
                </div>

                <h3 className="mb-2.5 text-[16px] font-bold leading-snug" style={{ color: T.text }}>{title}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: T.muted }}>{desc}</p>

                {/* Connector dot (not on last) */}
                {i < 2 && (
                  <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 md:block">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full"
                      style={{ background: T.bg, border: `1.5px solid ${T.border}` }}>
                      <ArrowRight className="h-3 w-3" style={{ color: T.faint }} />
                    </div>
                  </div>
                )}
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Compare preview ──────────────────────────────────────────────────────────

function ComparePreview() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  const products = [
    { label: "A", name: "Buldak Ramen",  color: T.purple,   scores: { g: 87, d: 74, m: 91 } },
    { label: "B", name: "Indomie Goreng", color: "#f59e0b", scores: { g: 71, d: 88, m: 65 } },
  ]

  const metrics = [
    { label: "Rise Probability",   a: 87, b: 71, color: T.green  },
    { label: "Current Demand",     a: 74, b: 88, color: T.amber  },
    { label: "Virality Score",     a: 91, b: 65, color: T.pink   },
    { label: "Social Mentions",    a: 83, b: 72, color: T.blue   },
  ]

  return (
    <section id="compare" className="px-6 py-28 md:px-16" style={{ background: T.bgAlt }}>
      <div className="mx-auto max-w-6xl">
        <FadeIn className="mb-16 text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: T.purpleHi }}>
            Compare
          </p>
          <h2 className="text-[40px] font-bold leading-[110%] tracking-tight" style={{ color: T.text }}>
            Head-to-head. Every metric.<br />
            <span style={{
              background: `linear-gradient(135deg, ${T.pink}, ${T.purpleHi})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>One click.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed" style={{ color: T.muted }}>
            The most requested feature in food trend analytics. Finally built right.
          </p>
        </FadeIn>

        <FadeIn>
          <div ref={ref} className="overflow-hidden rounded-2xl"
            style={{ background: T.card, border: `1px solid ${T.border}` }}>

            {/* Product headers */}
            <div className="grid grid-cols-2 border-b" style={{ borderColor: T.border }}>
              {products.map(({ label, name, color, scores }) => (
                <div key={label} className="p-6" style={{ borderRight: label === "A" ? `1px solid ${T.border}` : undefined }}>
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold"
                      style={{ background: `${color}20`, color }}>
                      {label}
                    </div>
                    <p className="text-[13px] font-bold" style={{ color: T.text }}>{name}</p>
                  </div>
                  <div className="flex gap-3">
                    {[
                      { label: "Growth",   val: scores.g, c: T.green },
                      { label: "Demand",   val: scores.d, c: T.amber },
                      { label: "Momentum", val: scores.m, c: T.pink  },
                    ].map(({ label: l, val, c }) => (
                      <div key={l} className="flex flex-1 flex-col items-center rounded-xl py-2.5"
                        style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${T.border}` }}>
                        <span className="text-lg font-bold tabular-nums" style={{ color: c }}>
                          <Counter target={val} color={c} />
                        </span>
                        <span className="text-[9px]" style={{ color: T.faint }}>{l}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Metric bars */}
            <div className="p-6 space-y-5">
              {metrics.map(({ label, a, b, color }, i) => {
                const winA = a >= b
                return (
                  <motion.div key={label}
                    initial={{ opacity: 0, x: -12 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.2 + i * 0.07, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[12px] font-semibold" style={{ color: T.text }}>{label}</span>
                      <span className="text-[10px] rounded-full px-2 py-0.5 font-semibold"
                        style={{ background: `${color}15`, color }}>
                        {winA ? "A leads" : "B leads"}
                      </span>
                    </div>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                      <div className="h-2 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <motion.div className="h-full rounded-full"
                          style={{ backgroundColor: winA ? color : `${color}40` }}
                          initial={{ width: 0 }}
                          animate={inView ? { width: `${a}%` } : {}}
                          transition={{ duration: 0.8, delay: 0.3 + i * 0.08 }}
                        />
                      </div>
                      <span className="text-[9px] font-bold px-1.5" style={{ color: T.faint }}>VS</span>
                      <div className="h-2 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                        <motion.div className="h-full rounded-full"
                          style={{ backgroundColor: !winA ? color : `${color}40` }}
                          initial={{ width: 0 }}
                          animate={inView ? { width: `${b}%` } : {}}
                          transition={{ duration: 0.8, delay: 0.3 + i * 0.08 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.2} className="mt-8 text-center">
          <PillButton href="/compare" filled>
            Try a comparison <ArrowRight className="h-3.5 w-3.5" />
          </PillButton>
        </FadeIn>
      </div>
    </section>
  )
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote: "We used TrendPulse to spot the Dubai Chocolate wave three weeks before it hit mainstream retail. That lead time was worth more than our entire analytics budget.",
    name: "Layla Mansouri",
    title: "Head of Consumer Insights",
    company: "Mena Foods Group",
    initials: "LM",
    color: T.purple,
  },
  {
    quote: "I analyzed 40 products across 4 categories in an afternoon. The compare feature alone replaced three hours of manual research. The AI summaries are shockingly good.",
    name: "Tomás Ferreira",
    title: "Senior Brand Strategist",
    company: "Unilever Prestige",
    initials: "TF",
    color: T.pink,
  },
  {
    quote: "Finally something built for FMCG people, not generic market research. The virality scores actually track with what we see 4–6 weeks later in sell-through data.",
    name: "Kenji Nakamura",
    title: "VP Innovation",
    company: "Nissin Foods Europe",
    initials: "KN",
    color: T.green,
  },
]

function Testimonials() {
  return (
    <section className="px-6 py-28 md:px-16">
      <div className="mx-auto max-w-6xl">
        <FadeIn className="mb-16 text-center">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: T.purpleHi }}>
            From analysts
          </p>
          <h2 className="text-[40px] font-bold leading-[110%] tracking-tight" style={{ color: T.text }}>
            Trusted by people who<br />can't afford to be wrong
          </h2>
        </FadeIn>

        <div className="grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map(({ quote, name, title, company, initials, color }, i) => (
            <FadeIn key={name} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -3 }}
                className="flex h-full flex-col rounded-2xl p-6 transition-transform"
                style={{ background: T.card, border: `1px solid ${T.border}` }}
              >
                {/* Stars */}
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-current" style={{ color: T.amber }} />
                  ))}
                </div>

                <p className="flex-1 text-[14px] leading-relaxed" style={{ color: T.muted }}>
                  &ldquo;{quote}&rdquo;
                </p>

                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold"
                    style={{ background: `${color}20`, color }}>
                    {initials}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: T.text }}>{name}</p>
                    <p className="text-[11px]" style={{ color: T.faint }}>{title} · {company}</p>
                  </div>
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

function FinalCTA() {
  return (
    <section className="relative overflow-hidden px-6 py-32 text-center md:px-16"
      style={{ background: T.bgAlt }}>
      {/* Glow orbs */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: `radial-gradient(circle, rgba(95,77,189,0.18) 0%, transparent 70%)`, filter: "blur(60px)" }}
          animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative mx-auto max-w-2xl">
        <FadeIn>
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: T.purpleHi }}>
            Get started
          </p>
          <h2 className="mb-5 text-[52px] font-black leading-[105%] tracking-tight" style={{ color: T.text }}>
            Start predicting<br />
            <span style={{
              background: `linear-gradient(135deg, ${T.pink} 0%, ${T.purpleHi} 50%, ${T.purple} 100%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              trends today
            </span>
          </h2>
          <p className="mb-10 text-[17px] leading-relaxed" style={{ color: T.muted }}>
            Join analysts who know what's viral before their competitors do.
          </p>

          <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
            <Link href="/login">
              <span className="inline-flex items-center gap-2.5 px-8 py-4 text-[15px] font-bold"
                style={{
                  borderRadius: 100,
                  background: `linear-gradient(135deg, ${T.purple}, ${T.purpleHi}, ${T.pink})`,
                  color: T.text,
                  boxShadow: `0 0 48px rgba(95,77,189,0.4), 0 0 80px rgba(233,179,242,0.1)`,
                }}
              >
                Get started for free <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </motion.div>

          <p className="mt-5 text-[12px]" style={{ color: T.faint }}>
            No credit card required · Powered by Claude AI · 8s average analysis
          </p>
        </FadeIn>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="px-8 py-10" style={{ borderTop: `1px solid ${T.border}` }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg"
            style={{ background: `${T.purple}30` }}>
            <TrendingUp className="h-3 w-3" style={{ color: T.purpleHi }} strokeWidth={2.5} />
          </div>
          <span className="text-[13px] font-semibold" style={{ color: T.muted }}>TrendPulse</span>
          <span className="text-[12px]" style={{ color: T.faint }}>— Viral Trend Intelligence</span>
        </div>

        <div className="flex items-center gap-6">
          {[
            { label: "Chat", href: "/" },
            { label: "Insights", href: "/insights" },
            { label: "Compare", href: "/compare" },
            { label: "Sign in", href: "/login" },
          ].map(({ label, href }) => (
            <Link key={label} href={href} className="text-[12px] transition-colors hover:opacity-80"
              style={{ color: T.faint }}>
              {label}
            </Link>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-6 max-w-6xl border-t pt-6" style={{ borderColor: T.border }}>
        <p className="text-center text-[11px]" style={{ color: T.faint }}>
          © 2026 TrendPulse · Built with Claude AI · All rights reserved
        </p>
      </div>
    </footer>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  const stats = [
    { value: "10K+",  label: "products analyzed" },
    { value: "<8s",   label: "per analysis" },
    { value: "3",     label: "AI models" },
  ]

  return (
    <section className="relative flex min-h-screen flex-col justify-center overflow-hidden px-6 pt-24 pb-16 md:px-16"
      style={{ background: T.bg }}>

      {/* Background glow orbs */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div className="absolute -left-40 top-1/3 h-[600px] w-[600px] rounded-full"
          style={{ background: `radial-gradient(circle, rgba(95,77,189,0.14) 0%, transparent 70%)`, filter: "blur(80px)" }}
          animate={{ y: [0, -24, 0], x: [0, 12, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div className="absolute -right-40 top-1/2 h-[500px] w-[500px] rounded-full"
          style={{ background: `radial-gradient(circle, rgba(233,179,242,0.1) 0%, transparent 70%)`, filter: "blur(80px)" }}
          animate={{ y: [0, 20, 0], x: [0, -16, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        {/* Grain overlay */}
        <div className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "128px",
          }}
        />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 md:grid-cols-2">

        {/* Text column */}
        <div>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="mb-7 inline-flex items-center gap-2 rounded-full px-4 py-1.5"
            style={{ background: `${T.purple}18`, border: `1px solid ${T.purple}30` }}
          >
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: T.purpleHi }} />
            <span className="text-[12px] font-semibold" style={{ color: T.purpleHi }}>
              AI-Powered Trend Intelligence
            </span>
          </motion.div>

          {/* H1 */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            className="mb-5 text-[56px] font-black leading-[105%] tracking-tight md:text-[62px]"
            style={{ color: T.text }}
          >
            Know what&apos;s viral{" "}
            <span style={{
              background: `linear-gradient(135deg, ${T.pink} 0%, ${T.purpleHi} 60%)`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              before
            </span>
            {" "}everyone else
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="mb-8 max-w-md text-[18px] leading-relaxed"
            style={{ color: T.muted }}
          >
            TrendPulse analyzes any food or FMCG product for viral potential in under 8 seconds.
            Powered by Claude AI.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="mb-10 flex flex-wrap items-center gap-3"
          >
            <PillButton href="/login" filled>
              Start for free <ArrowRight className="h-3.5 w-3.5" />
            </PillButton>
            <PillButton href="#features">
              See how it works
            </PillButton>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="flex items-center gap-7"
          >
            {stats.map(({ value, label }, i) => (
              <div key={label}>
                <p className="text-[22px] font-black" style={{ color: T.text }}>{value}</p>
                <p className="text-[12px]" style={{ color: T.faint }}>{label}</p>
                {i < stats.length - 1 && (
                  <div className="absolute ml-[110px] mt-[-28px] h-8 w-px opacity-20" style={{ background: T.text }} />
                )}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Mockup column */}
        <HeroMockup />
      </div>
    </section>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <div style={{ background: T.bg, color: T.text, fontFamily: "Inter, system-ui, sans-serif" }}>
      <Navbar />
      <Hero />
      <BrandTicker />
      <Features />
      <ProductPreview />
      <HowItWorks />
      <ComparePreview />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </div>
  )
}

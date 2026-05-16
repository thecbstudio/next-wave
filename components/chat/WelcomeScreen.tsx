"use client"

import { motion } from "framer-motion"
import { TrendingUp, Zap, BarChart2, Flame } from "lucide-react"

const suggestions = [
  {
    icon: Flame,
    title: "What food trend will blow up next quarter?",
    description: "TikTok signals + campus behavior",
  },
  {
    icon: Zap,
    title: "Why is this instant noodle brand going viral?",
    description: "Analyze emotional drivers",
  },
  {
    icon: BarChart2,
    title: "Which FMCG categories are youth shifting to?",
    description: "Budget consumer behavior insights",
  },
  {
    icon: TrendingUp,
    title: "Predict the next meme-driven product moment",
    description: "Internet culture x purchase intent",
  },
]

interface WelcomeScreenProps {
  onSuggest: (text: string) => void
}

export function WelcomeScreen({ onSuggest }: WelcomeScreenProps) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-16">
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className="mb-8 text-center"
      >
        <div className="mb-5 flex justify-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{
              background: "linear-gradient(135deg, hsl(262,82%,62%), hsl(262,68%,42%))",
              boxShadow: "0 6px 20px hsl(262 72% 50% / 0.4), 0 2px 6px hsl(262 72% 50% / 0.25)",
            }}
          >
            <TrendingUp className="h-6 w-6 text-white" strokeWidth={2.5} />
          </div>
        </div>
        <h1 className="mb-2.5 text-[28px] font-bold tracking-tight text-[hsl(var(--foreground))]">
          What trend are you{" "}
          <span
            style={{
              background: "linear-gradient(135deg, hsl(262,72%,50%), hsl(280,72%,60%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            hunting?
          </span>
        </h1>
        <p className="max-w-[360px] text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
          Viral food moments, campus culture shifts, FMCG signals — before they go mainstream.
        </p>
      </motion.div>

      {/* Cards */}
      <div className="grid w-full max-w-xl grid-cols-2 gap-3">
        {suggestions.map(({ icon: Icon, title, description }, i) => (
          <motion.button
            key={title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSuggest(title)}
            className="group flex flex-col gap-3 rounded-2xl border border-[hsl(var(--border))] bg-white p-4 text-left transition-all"
            style={{
              boxShadow: "0 1px 4px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.1), 0 0 0 1.5px hsl(262 72% 50% / 0.25)"
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)"
            }}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-xl transition-all group-hover:scale-110"
              style={{ background: "hsl(262 72% 50% / 0.1)" }}
            >
              <Icon className="h-4 w-4 text-[hsl(var(--primary))]" />
            </div>
            <div>
              <p className="text-[13px] font-semibold leading-snug text-[hsl(var(--foreground))]">
                {title}
              </p>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                {description}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

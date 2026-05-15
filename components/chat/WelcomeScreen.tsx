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
    description: "Internet culture × purchase intent",
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
        <div className="mb-4 flex justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--primary))] shadow-lg shadow-[hsl(262_72%_50%/0.25)]">
            <TrendingUp className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
        </div>
        <h1 className="mb-2 text-[22px] font-semibold tracking-tight text-[hsl(var(--foreground))]">
          What trend are you hunting?
        </h1>
        <p className="max-w-[340px] text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
          Viral food moments, campus culture shifts, FMCG signals — before they go mainstream.
        </p>
      </motion.div>

      {/* Cards */}
      <div className="grid w-full max-w-xl grid-cols-2 gap-2.5">
        {suggestions.map(({ icon: Icon, title, description }, i) => (
          <motion.button
            key={title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSuggest(title)}
            className="group flex flex-col gap-2.5 rounded-xl border border-[hsl(var(--border))] bg-white p-4 text-left shadow-sm transition-all hover:border-[hsl(262_72%_50%/0.35)] hover:shadow-md"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(262_72%_50%/0.08)] transition-colors group-hover:bg-[hsl(262_72%_50%/0.14)]">
              <Icon className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
            </div>
            <div>
              <p className="text-[13px] font-medium leading-snug text-[hsl(var(--foreground))]">
                {title}
              </p>
              <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                {description}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

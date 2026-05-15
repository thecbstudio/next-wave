"use client"

import { motion } from "framer-motion"
import { TrendingUp } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { Message } from "@/types/chat"

interface MessageBubbleProps {
  message: Message
  showAvatar?: boolean
}

const anim = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.25, 0.1, 0.25, 1] as const } },
}

export function MessageBubble({ message, showAvatar = true }: MessageBubbleProps) {
  const isUser = message.role === "user"

  if (isUser) {
    return (
      <motion.div variants={anim} initial="hidden" animate="visible" className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-[hsl(var(--primary))] px-4 py-2.5">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-white">
            {message.content}
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div variants={anim} initial="hidden" animate="visible" className="flex items-start gap-3">
      {/* Avatar — space reserved even when hidden to keep alignment */}
      <div className="mt-0.5 shrink-0">
        {showAvatar ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[hsl(var(--primary))]">
            <TrendingUp className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </div>
        ) : (
          <div className="h-7 w-7" />
        )}
      </div>

      <div className="min-w-0 max-w-[85%] rounded-2xl rounded-tl-sm border border-[hsl(var(--border))] bg-white px-4 py-3 shadow-sm">
        <div className="md-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </motion.div>
  )
}

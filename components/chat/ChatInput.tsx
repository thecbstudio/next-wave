"use client"

import { useRef, useEffect, KeyboardEvent } from "react"
import { ArrowUp } from "lucide-react"

interface ChatInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  disabled?: boolean
}

export function ChatInput({ value, onChange, onSubmit, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 168) + "px"
  }, [value])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (value.trim() && !disabled) onSubmit()
    }
  }

  const canSend = value.trim().length > 0 && !disabled

  return (
    <div className="relative px-4 pb-4 pt-2">
      {/* Gradient fade */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 left-0 right-0 h-10 bg-gradient-to-b from-transparent to-white"
      />

      <div className="mx-auto max-w-2xl">
        <div className="chat-input-ring flex items-end gap-2 rounded-xl border border-[hsl(var(--border))] bg-white px-4 py-3 shadow-sm transition-all">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Ask about food trends, viral products, youth culture… (Enter to send)"
            rows={1}
            aria-label="Message input"
            className="flex-1 resize-none bg-transparent text-sm leading-relaxed text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none disabled:opacity-40"
            style={{ maxHeight: "168px" }}
          />

          <button
            onClick={onSubmit}
            disabled={!canSend}
            aria-label="Send message"
            className={[
              "mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
              canSend
                ? "bg-[hsl(var(--primary))] text-white hover:opacity-90 active:scale-95"
                : "cursor-not-allowed bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]",
            ].join(" ")}
          >
            <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  )
}

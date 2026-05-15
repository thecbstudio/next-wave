"use client"

import React from "react"
import { motion } from "framer-motion"
import { Search, Upload, RefreshCcw, TrendingUp } from "lucide-react"

interface InsightsSearchBarProps {
  query: string
  setQuery: (v: string) => void
  onSubmit: () => void
  analyzing: boolean
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  imagePreviewUrl: string | null
  fileInputRef: React.RefObject<HTMLInputElement | null>
}

export function InsightsSearchBar({
  query,
  setQuery,
  onSubmit,
  analyzing,
  onFileSelect,
  imagePreviewUrl,
}: InsightsSearchBarProps) {
  // Derive display name from the preview URL presence (label shown on upload button)
  // The parent manages imageName state; we receive it implicitly via imagePreviewUrl being set.
  // We read the file input's value for display through the parent's onFileSelect handler.

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.05 }}
      className="mb-8 rounded-2xl border border-[hsl(var(--border))] bg-white p-5 shadow-sm"
    >
      <p className="mb-3 text-sm font-medium text-[hsl(var(--muted-foreground))]">
        Enter Product Name or Upload Image
      </p>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Text input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && onSubmit()}
            placeholder="e.g. Buldak Ramen, Indomie, Prime Hydration..."
            className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] py-2.5 pl-10 pr-4 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(262_72%_50%/0.12)] transition-all"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* File upload */}
          <label className="flex flex-1 sm:flex-initial cursor-pointer items-center justify-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-4 py-2.5 text-sm text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]">
            <Upload className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">{imagePreviewUrl ? "Image selected" : "Upload"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={onFileSelect} />
          </label>

          {/* Submit */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => onSubmit()}
            disabled={analyzing || (!query.trim() && !imagePreviewUrl)}
            className="flex flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl bg-[hsl(var(--primary))] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[hsl(262_72%_50%/0.25)] transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {analyzing ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <RefreshCcw className="h-4 w-4" />
              </motion.div>
            ) : (
              <TrendingUp className="h-4 w-4 shrink-0" />
            )}
            <span className="whitespace-nowrap">{analyzing ? "Analyzing..." : "Analyze"}</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

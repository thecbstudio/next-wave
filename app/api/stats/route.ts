import { getStats } from "@/lib/stats"

export const runtime = "nodejs"

// Public endpoint — no auth required (for landing page counter)
export async function GET() {
  const stats = await getStats()

  return Response.json({
    analyses: stats.analyses,
    comparisons: stats.comparisons,
    chat_messages: stats.chat_messages,
    // Derived totals for display
    total_analyses: stats.analyses + stats.comparisons,
    total_interactions: stats.analyses + stats.comparisons + stats.chat_messages,
  })
}

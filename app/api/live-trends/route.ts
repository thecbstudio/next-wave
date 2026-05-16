import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"

export const runtime = "nodejs"
export const maxDuration = 60

const N8N_TIMEOUT_MS = 52_000

function isEmptyOrVague(data: unknown): boolean {
  if (!data || typeof data !== "object") return true
  const text = JSON.stringify(data).toLowerCase()
  if (text.length < 100) return true
  const vagueSignals = [
    "no specific",
    "limited signal",
    "cannot confidently",
    "lacks concrete",
    "no data",
    "insufficient data",
  ]
  return vagueSignals.filter(s => text.includes(s)).length >= 2
}

async function claudeFallback(question: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return "No data available for this query."

  const client = new Anthropic({ apiKey })
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    system: `Today is ${today}. You are Next Wave AI, a viral trend intelligence analyst specializing in food, FMCG, and youth consumer behavior. Answer trend questions with specific insights, named platforms, demographics, and timeframes. Be direct and data-driven. Use **bold** for key points and bullet points for lists.`,
    messages: [{ role: "user", content: question }],
  })

  return msg.content[0].type === "text" ? msg.content[0].text : "No analysis available."
}

export async function POST(req: NextRequest) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL
  const body = await req.json()
  const { question } = body

  if (!webhookUrl) {
    const answer = await claudeFallback(question)
    return NextResponse.json({ answer, source: "claude" })
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), N8N_TIMEOUT_MS)

    let n8nData: unknown = null
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (res.ok) {
        n8nData = await res.json()
      }
    } catch (err: unknown) {
      clearTimeout(timeoutId)
      const isAbort = err instanceof Error && err.name === "AbortError"
      if (!isAbort) throw err
      // timeout → fall through to Claude fallback
    }

    if (n8nData && !isEmptyOrVague(n8nData)) {
      return NextResponse.json(n8nData)
    }

    // N8N timed out or returned vague data → Claude fallback
    const answer = await claudeFallback(question)
    return NextResponse.json({ answer, source: "claude" })

  } catch {
    const answer = await claudeFallback(question)
    return NextResponse.json({ answer, source: "claude" })
  }
}

import Anthropic from "@anthropic-ai/sdk"
import { increment } from "@/lib/stats"

function getSystemPrompt() {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  return `Today's date: ${today}.\n\nYou are Next Wave AI, an expert intelligence system specializing in predicting viral food and FMCG trends before they go mainstream.

Your expertise:
- Analyzing TikTok, Instagram, and YouTube signals for early viral indicators
- Understanding Gen Z and university campus consumer behavior
- Identifying FMCG micro-trends in food, beverages, and youth lifestyle products
- Spotting the emotional and cultural drivers behind viral products
- Predicting trend timelines and saturation windows

Your tone: Confident, data-driven, and specific. Use real numbers, timeframes, and demographic breakdowns when relevant. Format responses with **bold** for key insights and use bullet points for structured data. Be concise but impactful — every sentence should carry signal, not noise.`
}

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response("Missing API key", { status: 500 })
  }

  const { messages } = await req.json()

  // Track every user message sent (fire-and-forget)
  increment("chat_messages").catch(() => {})

  const client = new Anthropic({ apiKey })
  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          system: getSystemPrompt(),
          messages,
        })

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text))
          }
        }
      } catch (err) {
        console.error("Anthropic error:", err)
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}

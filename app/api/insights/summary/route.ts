import Anthropic from "@anthropic-ai/sdk"

const SYSTEM_PROMPT = `You are Next Wave AI, a trend intelligence analyst. Write a detailed, specific, data-rich analysis of the given product's viral potential and market position.

Write 2-3 paragraphs covering:
- Current viral drivers and cultural context (TikTok trends, Gen Z behavior, campus culture)
- Specific demographic data, timelines, and market signals
- Strategic recommendations for brands (distribution, creator seeding, timing windows)

Use specific numbers, timeframes, and named platforms. Write in confident, analyst tone. No headers, no bullets — flowing prose only.`

export const runtime = "edge"

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return new Response("Missing API key", { status: 500 })

  const { product, context } = await req.json()
  if (!product?.trim()) return new Response("No product provided", { status: 400 })

  const userMessage = context
    ? `Product: ${product}\nContext: ${JSON.stringify(context)}\n\nWrite the insights summary.`
    : `Product: ${product}\n\nWrite the insights summary.`

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = (new Anthropic({ apiKey })).messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 600,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userMessage }],
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
        console.error("Summary stream error:", err)
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}

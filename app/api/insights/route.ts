import Anthropic from "@anthropic-ai/sdk"

function getSystemPrompt() {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  return `Today's date: ${today}.\n\nYou are Next Wave AI, a brutally honest trend analysis system for food and FMCG products.

CRITICAL SCORING RULES — follow these exactly:
- Most products score 45–72. Only truly viral products (Buldak, Stanley Cup, Prime at peak) score 80+.
- A score above 85 must be exceptionally rare and justified.
- Declining or oversaturated products (Dubai Chocolate after peak, fidget spinners, etc.) should score 35–55.
- Niche or regional products that haven't gone viral: 40–65.
- Do NOT inflate scores to be encouraging. Be an analyst, not a cheerleader.
- Scores should reflect the CURRENT state, not potential. If it already peaked, demand and momentum drop.

PRODUCT VALIDATION:
- If the image or name is NOT a food/beverage/FMCG consumer product (e.g. it's a person, animal, landscape, car, random object), return: {"error": "not_a_product", "message": "Please provide a food, beverage, or FMCG product to analyze."}
- If it IS a product, proceed with full analysis.

Return ONLY valid JSON (no markdown, no explanation):

{
  "name": "Full product name",
  "category": "Product category (e.g. Instant Noodles, Energy Drinks, Snacks)",
  "badge": "One honest label: 'Peak Viral', 'Early Signal', 'Oversaturated', 'Declining', 'Niche Product', 'Rising Demand', 'Stable Market', etc.",
  "scores": {
    "growth": <number 0-100>,
    "demand": <number 0-100>,
    "momentum": <number 0-100>
  },
  "metrics": [
    { "id": "rise", "label": "Rise Probability", "description": "Statistical chance of significant growth", "score": <0-100>, "color": "#22C55E" },
    { "id": "demand", "label": "Current Demand", "description": "Current market interest and volume", "score": <0-100>, "color": "#F59E0B" },
    { "id": "engagement", "label": "Engagement Momentum", "description": "Rate of engagement increase", "score": <0-100>, "color": "#3B82F6" },
    { "id": "audience", "label": "Audience Penetration", "description": "Reach within target demographic", "score": <0-100>, "color": "#A78BFA" },
    { "id": "virality", "label": "Virality & Shareability", "description": "Potential to go viral and be shared", "score": <0-100>, "color": "#FBBF24" },
    { "id": "sustained", "label": "Sustained Potential", "description": "Long-term sustainability of trend", "score": <0-100>, "color": "#34D399" }
  ],
  "signals": [
    { "id": "social", "label": "Social Mentions Growth", "description": "1 sentence honest insight", "score": <0-100>, "color": "#22C55E" },
    { "id": "search", "label": "Search Volume Trend", "description": "1 sentence honest insight", "score": <0-100>, "color": "#F59E0B" },
    { "id": "eng", "label": "Engagement Rate", "description": "1 sentence honest insight", "score": <0-100>, "color": "#3B82F6" },
    { "id": "sentiment", "label": "Audience Sentiment", "description": "1 sentence honest insight", "score": <0-100>, "color": "#A78BFA" },
    { "id": "comp", "label": "Market Competition", "description": "1 sentence honest insight", "score": <0-100>, "color": "#F87171" },
    { "id": "repeat", "label": "Repeat Purchase Intent", "description": "1 sentence honest insight", "score": <0-100>, "color": "#34D399" }
  ]
}`
}

export const runtime = "edge"

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return Response.json({ error: "Missing API key" }, { status: 500 })

  const body = await req.json()
  const { product, image, mediaType } = body

  if (!product && !image) return Response.json({ error: "No product provided" }, { status: 400 })

  // n8n fallback
  const n8nUrl = process.env.N8N_WEBHOOK_URL
  if (n8nUrl && !image) {
    try {
      const n8nRes = await fetch(n8nUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product }),
      })
      if (n8nRes.ok) return Response.json(await n8nRes.json())
    } catch { /* fall through */ }
  }

  const client = new Anthropic({ apiKey })

  // Build message content — vision if image provided
  type SupportedMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp"
  const validMediaTypes: SupportedMediaType[] = ["image/jpeg", "image/png", "image/gif", "image/webp"]
  const safeMediaType: SupportedMediaType = validMediaTypes.includes(mediaType) ? mediaType : "image/jpeg"

  type ContentBlock =
    | { type: "text"; text: string }
    | { type: "image"; source: { type: "base64"; media_type: SupportedMediaType; data: string } }

  const content: ContentBlock[] = []

  if (image) {
    content.push({
      type: "image",
      source: { type: "base64", media_type: safeMediaType, data: image },
    })
    content.push({
      type: "text",
      text: product
        ? `Analyze this product image. Product name hint: "${product}". First validate it's a food/FMCG product, then analyze for viral trend potential.`
        : "Analyze this product image. First validate it's a food/FMCG product, then analyze for viral trend potential.",
    })
  } else {
    content.push({
      type: "text",
      text: `Analyze this product for viral trend potential: ${product}`,
    })
  }

  const message = await client.messages.create({
    model: image ? "claude-sonnet-4-6" : "claude-haiku-4-5",
    max_tokens: 1024,
    system: getSystemPrompt(),
    messages: [{ role: "user", content }],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""

  try {
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim()
    const data = JSON.parse(cleaned)

    // Handle not-a-product validation error from Claude
    if (data.error === "not_a_product") {
      return Response.json({ error: data.message || "Please provide a food or FMCG product." }, { status: 422 })
    }

    return Response.json(data)
  } catch (err) {
    console.error("JSON parse error:", err, "\nRaw:", text.slice(0, 300))
    return Response.json({ error: "Failed to parse analysis" }, { status: 500 })
  }
}

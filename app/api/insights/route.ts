import Anthropic from "@anthropic-ai/sdk"
import { increment } from "@/lib/stats"

function getSystemPrompt(hasImage: boolean) {
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  const validation = hasImage
    ? `PRODUCT VALIDATION (images only):
- If the image is NOT a food/beverage/FMCG consumer product (e.g. it's a person, animal, landscape, car, random object), return: {"error": "not_a_product", "message": "Please provide a food, beverage, or FMCG product to analyze."}
- If it IS a product, proceed with full analysis.`
    : `PRODUCT VALIDATION:
- You are always given a food, beverage, or FMCG product name. NEVER return not_a_product for text-only inputs.
- If the brand is unknown or regional, still analyze it â€” use "Regional Brand", "Emerging Brand", or "Unknown Brand" as badge and score conservatively (40â€“62).
- Infer the product category from the name context (e.g. "Activus" could be a drink/snack brand â€” analyze accordingly).`

  return `Today's date: ${today}.\n\nYou are Next Wave AI, a brutally honest trend analysis system for food and FMCG products.

CRITICAL SCORING RULES â€” follow these exactly:
- Most products score 45â€“72. Only truly viral products (Buldak, Stanley Cup, Prime at peak) score 80+.
- A score above 85 must be exceptionally rare and justified.
- Declining or oversaturated products (Dubai Chocolate after peak, fidget spinners, etc.) should score 35â€“55.
- Niche or regional products that haven't gone viral: 40â€“65.
- Unknown or unrecognized brands: score 38â€“58, be honest about limited data.
- Do NOT inflate scores to be encouraging. Be an analyst, not a cheerleader.
- Scores should reflect the CURRENT state, not potential. If it already peaked, demand and momentum drop.

${validation}

Return ONLY valid JSON (no markdown, no explanation):

{
  "name": "Full product name",
  "category": "Product category (e.g. Instant Noodles, Energy Drinks, Snacks)",
  "badge": "One honest label: 'Peak Viral', 'Early Signal', 'Oversaturated', 'Declining', 'Niche Product', 'Rising Demand', 'Stable Market', 'Regional Brand', 'Emerging Brand', etc.",
  "scores": { "growth": <0-100>, "demand": <0-100>, "momentum": <0-100> },
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

export const runtime = "nodejs"
export const maxDuration = 30

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return Response.json({ error: "Missing API key" }, { status: 500 })

  const body = await req.json()
  const { product, image, mediaType } = body

  if (!product && !image) return Response.json({ error: "No product provided" }, { status: 400 })

  const client = new Anthropic({ apiKey })

  type SupportedMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp"
  const validMediaTypes: SupportedMediaType[] = ["image/jpeg", "image/png", "image/gif", "image/webp"]
  const safeMediaType: SupportedMediaType = validMediaTypes.includes(mediaType) ? mediaType : "image/jpeg"

  type ContentBlock =
    | { type: "text"; text: string }
    | { type: "image"; source: { type: "base64"; media_type: SupportedMediaType; data: string } }

  const content: ContentBlock[] = []

  if (image) {
    content.push({ type: "image", source: { type: "base64", media_type: safeMediaType, data: image } })
    content.push({
      type: "text",
      text: product
        ? `Analyze this product image. Product name hint: "${product}". First validate it's a food/FMCG product, then analyze for viral trend potential.`
        : "Analyze this product image. First validate it's a food/FMCG product, then analyze for viral trend potential.",
    })
  } else {
    content.push({
      type: "text",
      text: `Analyze this food/FMCG product for viral trend potential: "${product}". This is a product name submitted by a user â€” always analyze it, even if you don't recognize the brand.`,
    })
  }

  try {
    const message = await client.messages.create({
      model: image ? "claude-sonnet-4-6" : "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: getSystemPrompt(!!image),
      messages: [{ role: "user", content }],
    })

    const text = message.content[0].type === "text" ? message.content[0].text : ""
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/, "").trim()

    let data: Record<string, unknown>
    try {
      data = JSON.parse(cleaned)
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (!match) return Response.json({ error: "Failed to parse analysis" }, { status: 500 })
      data = JSON.parse(match[0])
    }

    if (data.error === "not_a_product") {
      return Response.json({ error: data.message || "Please provide a food or FMCG product." }, { status: 422 })
    }
    increment("analyses").catch(() => {})
    return Response.json(data)
  } catch (err) {
    console.error("Insights API error:", err)
    return Response.json({ error: "Analysis failed — please try again" }, { status: 500 })
  }
}


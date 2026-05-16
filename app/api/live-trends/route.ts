import { NextRequest, NextResponse } from "next/server"
import { after } from "next/server"
import { Redis } from "@upstash/redis"

export const runtime = "nodejs"
export const maxDuration = 15

function getRedis(): Redis | null {
  try {
    const url = process.env.KV_REST_API_URL
    const token = process.env.KV_REST_API_TOKEN
    if (!url || !token) return null
    return new Redis({ url, token })
  } catch { return null }
}

export async function POST(req: NextRequest) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL
  const body = await req.json()
  const { question } = body

  if (!webhookUrl) {
    return NextResponse.json({ error: "N8N_WEBHOOK_URL not configured" }, { status: 500 })
  }

  const jobId = crypto.randomUUID()
  const callbackUrl = "https://next-wave-three.vercel.app/api/live-trends/callback"

  const redis = getRedis()
  if (redis) {
    await redis.set(`livetrends:${jobId}`, JSON.stringify({ status: "processing" }), { ex: 300 })
  }

  after(async () => {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, jobId, callbackUrl }),
      })
    } catch (err) {
      console.error("N8N fetch error:", err)
      const r = getRedis()
      if (r) {
        await r.set(`livetrends:${jobId}`, JSON.stringify({ status: "error", error: "Failed to reach N8N" }), { ex: 300 })
      }
    }
  })

  return NextResponse.json({ jobId, status: "processing" })
}

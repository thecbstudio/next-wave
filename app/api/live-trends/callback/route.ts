import { NextRequest, NextResponse } from "next/server"
import { Redis } from "@upstash/redis"

export const runtime = "nodejs"

function getRedis(): Redis | null {
  try {
    const url = process.env.KV_REST_API_URL
    const token = process.env.KV_REST_API_TOKEN
    if (!url || !token) return null
    return new Redis({ url, token })
  } catch { return null }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { jobId, answer, result, output, error } = body

  if (!jobId) return NextResponse.json({ error: "Missing jobId" }, { status: 400 })

  const redis = getRedis()
  if (!redis) return NextResponse.json({ error: "No storage" }, { status: 500 })

  const raw = answer ?? result ?? output ?? null

  if (error || !raw) {
    await redis.set(`livetrends:${jobId}`, JSON.stringify({ status: "error", error: error || "No result" }), { ex: 300 })
  } else {
    const text = typeof raw === "string" ? raw.replace(/\n/g, "\n") : JSON.stringify(raw, null, 2)
    await redis.set(`livetrends:${jobId}`, JSON.stringify({ status: "done", answer: text }), { ex: 300 })
  }

  return NextResponse.json({ ok: true })
}

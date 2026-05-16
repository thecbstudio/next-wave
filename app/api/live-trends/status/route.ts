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

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId")
  if (!jobId) return NextResponse.json({ error: "Missing jobId" }, { status: 400 })

  const redis = getRedis()
  if (!redis) return NextResponse.json({ status: "error", error: "No storage" })

  const raw = await redis.get<string>(`livetrends:${jobId}`)
  if (!raw) return NextResponse.json({ status: "not_found" }, { status: 404 })

  const data = typeof raw === "string" ? JSON.parse(raw) : raw
  return NextResponse.json(data)
}

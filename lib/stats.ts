import { Redis } from "@upstash/redis"

let redis: Redis | null = null

function getRedis(): Redis | null {
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
    if (!redis) redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    return redis
  } catch {
    return null
  }
}

export type StatKey = "analyses" | "comparisons" | "chat_messages"

export async function increment(key: StatKey): Promise<void> {
  try {
    const r = getRedis()
    if (!r) return
    await r.incr(`stat:${key}`)
  } catch { /* silent */ }
}

export async function getStats(): Promise<Record<StatKey, number>> {
  try {
    const r = getRedis()
    if (!r) return { analyses: 0, comparisons: 0, chat_messages: 0 }
    const [analyses, comparisons, chats] = await Promise.all([
      r.get<number>("stat:analyses"),
      r.get<number>("stat:comparisons"),
      r.get<number>("stat:chat_messages"),
    ])
    return {
      analyses: analyses ?? 0,
      comparisons: comparisons ?? 0,
      chat_messages: chats ?? 0,
    }
  } catch {
    return { analyses: 0, comparisons: 0, chat_messages: 0 }
  }
}

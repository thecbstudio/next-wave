export const runtime = "nodejs"

export async function POST() {
  const res = Response.json({ ok: true })
  res.headers.set("Set-Cookie", "tp_auth=; Path=/; HttpOnly; Max-Age=0")
  return res
}

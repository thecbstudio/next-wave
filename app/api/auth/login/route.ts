export const runtime = "edge"

export async function POST(req: Request) {
  const { password } = await req.json()
  const correct = process.env.AUTH_PASSWORD ?? "cinar2007"

  if (password !== correct) {
    return Response.json({ error: "Wrong password" }, { status: 401 })
  }

  const res = Response.json({ ok: true })
  // 30-day cookie, httpOnly so JS can't read it
  res.headers.set(
    "Set-Cookie",
    `tp_auth=ok; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`
  )
  return res
}

export async function POST(req: Request) {
  const { password } = await req.json()
  const correct = process.env.AUTH_PASSWORD
  if (!correct) return Response.json({ error: "Server misconfiguration" }, { status: 500 })

  if (password !== correct) {
    return Response.json({ error: "Wrong password" }, { status: 401 })
  }

  const secure = process.env.NODE_ENV === "production" ? "; Secure" : ""
  const res = Response.json({ ok: true })
  res.headers.set(
    "Set-Cookie",
    `tp_auth=ok; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}${secure}`
  )
  return res
}

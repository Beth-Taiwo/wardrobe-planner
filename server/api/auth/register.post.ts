import { createSession, hashPassword, normalizeEmail, publicUser } from "../../utils/auth"
import { prisma } from "../../utils/db"

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const email = typeof body.email === "string" ? body.email.trim() : ""
  const password = typeof body.password === "string" ? body.password : ""
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : ""
  const normalizedEmail = normalizeEmail(email)

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw createError({ statusCode: 400, statusMessage: "Enter a valid email address." })
  }

  if (password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: "Password must be at least 8 characters." })
  }

  const existing = await prisma.user.findUnique({ where: { normalizedEmail } })
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: "An account already exists for that email." })
  }

  const user = await prisma.user.create({
    data: {
      id: crypto.randomUUID(),
      email,
      normalizedEmail,
      displayName: displayName || null,
      passwordHash: await hashPassword(password)
    },
    include: { oauthAccounts: { select: { provider: true } } }
  })

  await createSession(event, user.id)
  return { user: publicUser(user) }
})

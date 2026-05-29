import { createSession, normalizeEmail, publicUser, verifyPassword } from "../../utils/auth"
import { prisma } from "../../utils/db"

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const normalizedEmail = normalizeEmail(typeof body.email === "string" ? body.email : "")
  const password = typeof body.password === "string" ? body.password : ""

  const user = await prisma.user.findUnique({
    where: { normalizedEmail },
    include: { oauthAccounts: { select: { provider: true } } }
  })

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw createError({ statusCode: 401, statusMessage: "Email or password is incorrect." })
  }

  await createSession(event, user.id)
  return { user: publicUser(user) }
})

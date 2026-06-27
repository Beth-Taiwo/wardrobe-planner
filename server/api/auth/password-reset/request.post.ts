import { prisma } from "../../../utils/db"
import { generateToken, hashToken, normalizeEmail } from "../../../utils/auth"
import { deliverPasswordResetEmail } from "../../../utils/mail"

const resetTokenDurationMs = 60 * 60 * 1000

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const email = typeof body?.email === "string" ? body.email : ""

  // Always respond identically so the screen never reveals whether an email has an account.
  const genericResponse = { message: "If that email has an account, we've sent a reset link." }

  if (!email.trim()) {
    return genericResponse
  }

  const user = await prisma.user.findUnique({ where: { normalizedEmail: normalizeEmail(email) } })
  if (!user) {
    return genericResponse
  }

  const token = generateToken()
  await prisma.passwordResetToken.create({
    data: {
      id: crypto.randomUUID(),
      tokenHash: hashToken(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + resetTokenDurationMs)
    }
  })

  const link = getRequestURL(event).origin + "/reset-password?token=" + token
  await deliverPasswordResetEmail(user.email, link)

  return genericResponse
})

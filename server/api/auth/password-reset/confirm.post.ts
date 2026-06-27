import { prisma } from "../../../utils/db"
import { createSession, hashPassword, hashToken } from "../../../utils/auth"

const minPasswordLength = 8

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const token = typeof body?.token === "string" ? body.token : ""
  const password = typeof body?.password === "string" ? body.password : ""

  if (!token) {
    throw createError({ statusCode: 400, statusMessage: "This reset link is invalid or has expired." })
  }

  if (password.length < minPasswordLength) {
    throw createError({ statusCode: 400, statusMessage: "Password must be at least " + minPasswordLength + " characters." })
  }

  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(token) } })
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw createError({ statusCode: 400, statusMessage: "This reset link is invalid or has expired." })
  }

  const passwordHash = await hashPassword(password)

  // Set the new password, consume the token, and invalidate every existing session for the account.
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.session.deleteMany({ where: { userId: record.userId } })
  ])

  // Then sign the person in on this device.
  await createSession(event, record.userId)

  return { ok: true }
})

import { hashPassword, requireUser, verifyPassword } from "../../utils/auth"
import { prisma } from "../../utils/db"

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody(event)
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : ""
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : ""

  if (newPassword.length < 8) {
    throw createError({ statusCode: 400, statusMessage: "New password must be at least 8 characters." })
  }

  const record = await prisma.user.findUnique({ where: { id: user.id } })
  if (!record) {
    throw createError({ statusCode: 404, statusMessage: "Account not found." })
  }

  if (record.passwordHash && !(await verifyPassword(currentPassword, record.passwordHash))) {
    throw createError({ statusCode: 401, statusMessage: "Current password is incorrect." })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) }
  })

  return { ok: true }
})

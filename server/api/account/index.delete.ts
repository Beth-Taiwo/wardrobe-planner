import { clearAuthSession, requireUser } from "../../utils/auth"
import { prisma } from "../../utils/db"

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)

  await prisma.$transaction(async (tx) => {
    const entries = await tx.dressEntry.findMany({ where: { userId: user.id }, select: { id: true } })
    await tx.session.deleteMany({ where: { userId: user.id } })
    await tx.oAuthAccount.deleteMany({ where: { userId: user.id } })
    await tx.passwordResetToken.deleteMany({ where: { userId: user.id } })
    await tx.dressEntryItem.deleteMany({ where: { dressEntryId: { in: entries.map((entry) => entry.id) } } })
    await tx.dressEntry.deleteMany({ where: { userId: user.id } })
    await tx.clothingItem.deleteMany({ where: { userId: user.id } })
    await tx.user.delete({ where: { id: user.id } })
  })

  await clearAuthSession(event)
  return { ok: true }
})

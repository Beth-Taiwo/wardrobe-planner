import { getCurrentUser, requireUser } from "../../utils/auth"
import { prisma } from "../../utils/db"

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody(event)
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : ""

  await prisma.user.update({
    where: { id: user.id },
    data: { displayName: displayName || null }
  })

  const refreshed = await getCurrentUser(event)
  return { user: refreshed }
})

import { listOutfitPlans } from "../../utils/db"
import { requireUser } from "../../utils/auth"

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const query = getQuery(event)
  const date = typeof query.date === "string" ? query.date : null
  const upcoming = query.upcoming === "true"
  const limit = typeof query.limit === "string" ? Math.max(1, Math.min(50, Number(query.limit) || 10)) : undefined

  return listOutfitPlans(user.id, { date, upcoming, limit })
})

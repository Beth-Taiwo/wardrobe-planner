import { getDressStats } from "../../utils/db"
import { requireUser } from "../../utils/auth"

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  return getDressStats(user.id)
})

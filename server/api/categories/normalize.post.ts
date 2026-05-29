import { normalizeMissingDressCategories } from "../../utils/db"
import { inferCategory } from "../../utils/dress"
import { requireUser } from "../../utils/auth"

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  return normalizeMissingDressCategories(user.id, inferCategory)
})

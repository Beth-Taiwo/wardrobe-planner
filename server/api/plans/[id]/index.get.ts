import { findOutfitPlan } from "../../../utils/db"
import { requireUser } from "../../../utils/auth"

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, "id")

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Plan id is required." })
  }

  const plan = await findOutfitPlan(user.id, id)

  if (!plan) {
    throw createError({ statusCode: 404, statusMessage: "Outfit plan not found." })
  }

  return plan
})

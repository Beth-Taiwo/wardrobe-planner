import { OutfitPlanItemOwnershipError, saveOutfitPlan } from "../../utils/db"
import { cleanOptional, outfitPlanSchema } from "../../utils/dress"
import { requireUser } from "../../utils/auth"

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody(event)
  const parsed = outfitPlanSchema.parse({
    date: body.date,
    eventName: body.eventName,
    prepNotes: cleanOptional(body.prepNotes),
    clothingItemIds: Array.isArray(body.clothingItemIds) ? body.clothingItemIds : []
  })
  const id = typeof body.id === "string" && body.id.trim() ? body.id.trim() : null

  if (parsed.date < new Date().toISOString().slice(0, 10)) {
    throw createError({ statusCode: 400, statusMessage: "Choose today or a future date for outfit planning." })
  }

  let saved
  try {
    saved = await saveOutfitPlan(user.id, id, parsed)
  } catch (error) {
    if (error instanceof OutfitPlanItemOwnershipError) {
      throw createError({ statusCode: 400, statusMessage: error.message })
    }

    throw error
  }

  if (!saved) {
    throw createError({ statusCode: 404, statusMessage: "Outfit plan not found." })
  }

  return saved
})

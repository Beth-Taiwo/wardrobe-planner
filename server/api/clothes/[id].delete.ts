import { deleteClothingItem } from "../../utils/db"
import { requireUser } from "../../utils/auth"

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, "id")

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Clothing item id is required." })
  }

  const count = await deleteClothingItem(user.id, id)
  if (!count) {
    throw createError({ statusCode: 404, statusMessage: "Clothing item not found." })
  }

  return { ok: true }
})

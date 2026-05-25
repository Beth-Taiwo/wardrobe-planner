import { deleteClothingItem } from "../../utils/db"

export default defineEventHandler((event) => {
  const id = getRouterParam(event, "id")

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Clothing item id is required." })
  }

  deleteClothingItem(id)

  return { ok: true }
})

import { deleteClothingItem } from "../../utils/db"

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id")

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Clothing item id is required." })
  }

  await deleteClothingItem(id)

  return { ok: true }
})

import { updateClothingItem } from "../../utils/db"
import { cleanOptional } from "../../utils/dress"

const allowedLabels = new Set([
  "Blouse",
  "Shirt",
  "Skirt",
  "Dress",
  "Gown",
  "Trousers",
  "Jeans",
  "Kimono",
  "Boubou",
  "Jacket",
  "Top",
  "Shoes",
  "Accessory",
  "Other"
])

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id")
  const body = await readBody(event)
  const name = typeof body.name === "string" ? body.name.trim() : ""
  const label = typeof body.label === "string" ? body.label.trim() : ""

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "Clothing item id is required." })
  }

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: "Clothing name is required." })
  }

  if (!allowedLabels.has(label)) {
    throw createError({ statusCode: 400, statusMessage: "Choose a valid clothing label." })
  }

  const item = updateClothingItem(id, {
    name,
    label,
    color: cleanOptional(body.color),
    imageUrl: cleanOptional(body.imageUrl),
    notes: cleanOptional(body.notes)
  })

  if (!item) {
    throw createError({ statusCode: 404, statusMessage: "Clothing item not found." })
  }

  return item
})

import { createClothingItem } from "../../utils/db"
import { cleanOptional } from "../../utils/dress"
import { requireUser } from "../../utils/auth"

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
  const user = await requireUser(event)
  const body = await readBody(event)
  const name = typeof body.name === "string" ? body.name.trim() : ""
  const label = typeof body.label === "string" ? body.label.trim() : ""

  if (!name) {
    throw createError({ statusCode: 400, statusMessage: "Clothing name is required." })
  }

  if (!allowedLabels.has(label)) {
    throw createError({ statusCode: 400, statusMessage: "Choose a valid clothing label." })
  }

  return await createClothingItem(user.id, {
    name,
    label,
    color: cleanOptional(body.color),
    imageUrl: cleanOptional(body.imageUrl),
    notes: cleanOptional(body.notes)
  })
})

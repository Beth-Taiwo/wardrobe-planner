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
  const imageUrl = cleanOptional(body.imageUrl)

  if (!name && !imageUrl) {
    throw createError({ statusCode: 400, statusMessage: "Add a clothing name or image." })
  }

  if (label && !allowedLabels.has(label)) {
    throw createError({ statusCode: 400, statusMessage: "Choose a valid clothing label." })
  }

  return await createClothingItem(user.id, {
    name: name || `New ${label || "clothing piece"}`,
    label,
    color: cleanOptional(body.color),
    imageUrl,
    notes: cleanOptional(body.notes)
  })
})

import { createClothingItem } from "../../utils/db"
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
  const body = await readBody(event)
  const items = Array.isArray(body.items) ? body.items : []

  if (!items.length) {
    throw createError({ statusCode: 400, statusMessage: "Add at least one clothing piece." })
  }

  const created = []
  const skipped = []

  for (const [index, item] of items.entries()) {
    const name = typeof item?.name === "string" ? item.name.trim() : ""
    const label = typeof item?.label === "string" ? item.label.trim() : ""

    if (!name) {
      skipped.push({ index, reason: "Missing name." })
      continue
    }

    if (!allowedLabels.has(label)) {
      skipped.push({ index, name, reason: "Invalid label." })
      continue
    }

    created.push(createClothingItem({
      name,
      label,
      color: cleanOptional(item.color),
      imageUrl: cleanOptional(item.imageUrl),
      notes: cleanOptional(item.notes)
    }))
  }

  if (!created.length) {
    throw createError({ statusCode: 400, statusMessage: "No valid clothing pieces found." })
  }

  return {
    count: created.length,
    items: created,
    skipped
  }
})

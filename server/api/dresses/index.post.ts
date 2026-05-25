import { updateDressEntry, upsertDressEntry } from '../../utils/db'
import { cleanOptional, dressEntrySchema } from '../../utils/dress'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = dressEntrySchema.parse({
    date: body.date,
    title: body.title,
    color: cleanOptional(body.color),
    category: cleanOptional(body.category),
    notes: cleanOptional(body.notes),
    imageUrl: cleanOptional(body.imageUrl),
    sourceUrl: cleanOptional(body.sourceUrl),
    clothingItemIds: Array.isArray(body.clothingItemIds) ? body.clothingItemIds : []
  })

  if (typeof body.id === 'string' && body.id.trim()) {
    try {
      return updateDressEntry(body.id, parsed)
    } catch (error: any) {
      if (String(error?.message || '').includes('UNIQUE constraint failed')) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Another outfit already exists for that date.'
        })
      }

      throw error
    }
  }

  return upsertDressEntry(parsed)
})

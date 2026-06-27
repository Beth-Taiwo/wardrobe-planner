import { isUniqueConstraintError, updateDressEntry, upsertDressEntry } from '../../utils/db'
import { cleanOptional, dressEntrySchema } from '../../utils/dress'
import { requireUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody(event)
  const parsed = dressEntrySchema.parse({
    date: body.date,
    title: body.title,
    color: cleanOptional(body.color),
    category: cleanOptional(body.category),
    notes: cleanOptional(body.notes),
    imageUrl: cleanOptional(body.imageUrl),
    clothingItemIds: Array.isArray(body.clothingItemIds) ? body.clothingItemIds : []
  })

  if (typeof body.id === 'string' && body.id.trim()) {
    try {
      const saved = await updateDressEntry(user.id, body.id, parsed)
      if (!saved) {
        throw createError({ statusCode: 404, statusMessage: 'Dress entry not found.' })
      }
      return saved
    } catch (error: any) {
      if (isUniqueConstraintError(error) || String(error?.message || '').includes('UNIQUE constraint failed')) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Another outfit already exists for that date.'
        })
      }

      throw error
    }
  }

  return upsertDressEntry(user.id, parsed)
})

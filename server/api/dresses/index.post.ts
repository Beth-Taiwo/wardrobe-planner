import { upsertDressEntry } from '../../utils/db'
import { cleanOptional, dressEntrySchema } from '../../utils/dress'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = dressEntrySchema.parse({
    date: body.date,
    title: body.title,
    color: cleanOptional(body.color),
    category: cleanOptional(body.category),
    weather: cleanOptional(body.weather),
    notes: cleanOptional(body.notes),
    imageUrl: cleanOptional(body.imageUrl),
    sourceUrl: cleanOptional(body.sourceUrl)
  })

  return upsertDressEntry(parsed)
})

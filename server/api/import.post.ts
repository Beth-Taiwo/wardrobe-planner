import { db, upsertDressEntry } from '../utils/db'
import { parseKeepEntries } from '../utils/dress'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const fallbackYear = Number(body.year) || new Date().getFullYear()
  const entries = parseKeepEntries(String(body.text || ''), fallbackYear)

  if (!entries.length) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No dated dress entries were found.'
    })
  }

  const saveMany = db.transaction(() =>
    entries.map((entry) =>
      upsertDressEntry({
        ...entry,
        sourceUrl: 'https://keep.google.com/u/0/#NOTE/1rxrgh8G769r5fhSDrtLzGs0OQ-buStywyjO3tP2G5ahBi4U30WTJz60ow8d3DP3RE_Wa'
      })
    )
  )

  const saved = saveMany()

  return { count: saved.length, entries: saved }
})

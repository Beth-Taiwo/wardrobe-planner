import { importDressEntries } from "../utils/db"
import { previewKeepEntries } from "../utils/dress"
import { requireUser } from "../utils/auth"

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const body = await readBody(event)
  const fallbackYear = Number(body.year) || new Date().getFullYear()
  const preview = previewKeepEntries(String(body.text || ""), fallbackYear)
  const entries = preview.entries

  if (!entries.length) {
    throw createError({
      statusCode: 400,
      statusMessage: "No dated dress entries were found."
    })
  }

  const saved = await importDressEntries(user.id, entries.map((entry) => ({
    ...entry,
    sourceUrl: "manual-google-keep-import"
  })))

  return {
    count: saved.length,
    skippedCount: preview.skipped.length,
    invalidCount: preview.invalid.length,
    entries: saved,
    skipped: preview.skipped,
    invalid: preview.invalid
  }
})

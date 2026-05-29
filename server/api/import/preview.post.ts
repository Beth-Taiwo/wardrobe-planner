import { previewKeepEntries } from "../../utils/dress"
import { requireUser } from "../../utils/auth"

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const body = await readBody(event)
  const fallbackYear = Number(body.year) || new Date().getFullYear()
  const preview = previewKeepEntries(String(body.text || ""), fallbackYear)

  return {
    count: preview.entries.length,
    skippedCount: preview.skipped.length,
    invalidCount: preview.invalid.length,
    entries: preview.entries,
    skipped: preview.skipped,
    invalid: preview.invalid
  }
})

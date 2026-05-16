import { db, type DressEntryRow } from "../../utils/db"
import { inferCategory } from "../../utils/dress"

export default defineEventHandler(() => {
  const rows = db.prepare("SELECT * FROM dress_entries WHERE category IS NULL OR TRIM(category) = '' ORDER BY date ASC").all() as DressEntryRow[]
  const update = db.prepare("UPDATE dress_entries SET category = @category, updated_at = CURRENT_TIMESTAMP WHERE id = @id")
  let updated = 0
  const changes: Array<{ date: string, title: string, category: string }> = []

  const normalize = db.transaction(() => {
    for (const row of rows) {
      const category = inferCategory(row.title)
      if (!category) {
        continue
      }

      update.run({ id: row.id, category })
      updated += 1
      changes.push({ date: row.date, title: row.title, category })
    }
  })

  normalize()

  return { updated, changes }
})

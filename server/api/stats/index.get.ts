import { db, type DressEntryRow } from "../../utils/db"

export default defineEventHandler(() => {
  const rows = db.prepare("SELECT * FROM dress_entries ORDER BY date ASC").all() as DressEntryRow[]
  const byTitle = new Map<string, { title: string, count: number, lastWorn: string }>()
  const byCategory = new Map<string, number>()
  const nowYear = new Date().getFullYear()
  let uncategorized = 0
  let wornThisYear = 0

  for (const row of rows) {
    const key = normalizeTitle(row.title)
    if (key) {
      const current = byTitle.get(key) || { title: row.title, count: 0, lastWorn: row.date }
      current.count += 1
      if (row.date > current.lastWorn) {
        current.lastWorn = row.date
        current.title = row.title
      }
      byTitle.set(key, current)
    }

    if (row.category) {
      byCategory.set(row.category, (byCategory.get(row.category) || 0) + 1)
    } else {
      uncategorized += 1
    }

    if (row.date.startsWith(String(nowYear) + "-")) {
      wornThisYear += 1
    }
  }

  const mostWorn = [...byTitle.values()].sort((a, b) => b.count - a.count || b.lastWorn.localeCompare(a.lastWorn)).slice(0, 5)
  const categories = [...byCategory.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count || a.category.localeCompare(b.category))
  const notWornThisYear = [...byTitle.values()].filter((item) => !item.lastWorn.startsWith(String(nowYear) + "-")).sort((a, b) => a.lastWorn.localeCompare(b.lastWorn)).slice(0, 5)

  return {
    totalEntries: rows.length,
    uniqueOutfits: byTitle.size,
    wornThisYear,
    uncategorized,
    mostWorn,
    categories,
    notWornThisYear
  }
})

function normalizeTitle(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

import { db, toDressEntry, type DressEntryRow } from "../../utils/db"

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const title = typeof query.title === "string" ? query.title.trim() : ""

  if (!title) {
    throw createError({ statusCode: 400, statusMessage: "Provide an outfit title." })
  }

  const normalized = normalizeTitle(title)
  const rows = db.prepare("SELECT * FROM dress_entries ORDER BY date DESC").all() as DressEntryRow[]
  const matches = rows.filter((row) => normalizeTitle(row.title) === normalized)

  return {
    title,
    count: matches.length,
    entries: matches.map(toDressEntry)
  }
})

function normalizeTitle(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

import { db, toDressEntry, type DressEntryRow } from "../../utils/db"

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const date = typeof query.date === "string" ? query.date : null
  const month = typeof query.month === "string" ? query.month : null
  const year = typeof query.year === "string" ? query.year : null
  const text = typeof query.q === "string" ? query.q.trim() : ""
  const category = typeof query.category === "string" ? query.category.trim() : ""
  const where: string[] = []
  const params: unknown[] = []

  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    where.push("date = ?")
    params.push(date)
  } else if (month && /^\d{4}-\d{2}$/.test(month)) {
    where.push("date LIKE ?")
    params.push(month + "%")
  } else if (year && /^\d{4}$/.test(year)) {
    where.push("date LIKE ?")
    params.push(year + "-%")
  }

  if (text) {
    where.push("LOWER(title) LIKE ?")
    params.push("%" + text.toLowerCase() + "%")
  }

  if (category) {
    where.push("category = ?")
    params.push(category)
  }

  const sql = "SELECT * FROM dress_entries" + (where.length ? " WHERE " + where.join(" AND ") : "") + " ORDER BY date ASC"
  const rows = db.prepare(sql).all(...params) as DressEntryRow[]

  return rows.map(toDressEntry)
})

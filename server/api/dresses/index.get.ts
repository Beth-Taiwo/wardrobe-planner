import { db, toDressEntry, type DressEntryRow } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const month = typeof query.month === 'string' ? query.month : null

  const rows = month
    ? db
      .prepare('SELECT * FROM dress_entries WHERE date LIKE ? ORDER BY date ASC')
      .all(`${month}%`) as DressEntryRow[]
    : db
      .prepare('SELECT * FROM dress_entries ORDER BY date ASC')
      .all() as DressEntryRow[]

  return rows.map(toDressEntry)
})

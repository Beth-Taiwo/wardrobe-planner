import { db, toDressEntry, type DressEntryRow } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const date = typeof query.date === 'string' ? query.date : null
  const month = typeof query.month === 'string' ? query.month : null
  const year = typeof query.year === 'string' ? query.year : null

  let rows: DressEntryRow[]

  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    rows = db
      .prepare('SELECT * FROM dress_entries WHERE date = ? ORDER BY date ASC')
      .all(date) as DressEntryRow[]
  } else if (month && /^\d{4}-\d{2}$/.test(month)) {
    rows = db
      .prepare('SELECT * FROM dress_entries WHERE date LIKE ? ORDER BY date ASC')
      .all(month + '%') as DressEntryRow[]
  } else if (year && /^\d{4}$/.test(year)) {
    rows = db
      .prepare('SELECT * FROM dress_entries WHERE date LIKE ? ORDER BY date ASC')
      .all(year + '-%') as DressEntryRow[]
  } else {
    rows = db
      .prepare('SELECT * FROM dress_entries ORDER BY date ASC')
      .all() as DressEntryRow[]
  }

  return rows.map(toDressEntry)
})

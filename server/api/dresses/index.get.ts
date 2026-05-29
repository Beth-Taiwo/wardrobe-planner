import { listDressEntries } from "../../utils/db"

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const date = typeof query.date === "string" ? query.date : null
  const month = typeof query.month === "string" ? query.month : null
  const year = typeof query.year === "string" ? query.year : null
  const text = typeof query.q === "string" ? query.q.trim() : ""
  const category = typeof query.category === "string" ? query.category.trim() : ""
  return listDressEntries({ date, month, year, text, category })
})

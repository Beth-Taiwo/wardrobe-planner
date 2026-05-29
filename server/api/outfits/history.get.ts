import { listDressEntries } from "../../utils/db"
import { requireUser } from "../../utils/auth"

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const query = getQuery(event)
  const title = typeof query.title === "string" ? query.title.trim() : ""

  if (!title) {
    throw createError({ statusCode: 400, statusMessage: "Provide an outfit title." })
  }

  const normalized = normalizeTitle(title)
  const rows = await listDressEntries(user.id, { order: "desc" })
  const matches = rows.filter((row) => normalizeTitle(row.title) === normalized)

  return {
    title,
    count: matches.length,
    entries: matches
  }
})

function normalizeTitle(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

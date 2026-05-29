import { listDressEntries } from "../../utils/db"
import { requireUser } from "../../utils/auth"

const datePattern = /^\d{4}-\d{2}-\d{2}$/

interface Candidate {
  row: Awaited<ReturnType<typeof listDressEntries>>[number]
  count: number
}

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const query = getQuery(event)
  const date = typeof query.date === "string" ? query.date : ""
  const windowDays = typeof query.windowDays === "string" ? Math.max(30, Math.min(180, Number(query.windowDays) || 60)) : 60

  if (!datePattern.test(date)) {
    throw createError({ statusCode: 400, statusMessage: "Provide a target date as YYYY-MM-DD." })
  }

  const targetDate = parseDate(date)
  const rows = await listDressEntries(user.id, { excludeDate: date })
  const recentTitles: string[] = []
  const counts = new Map<string, number>()
  const latestByTitle = new Map<string, Candidate>()

  for (const row of rows) {
    const key = normalizeTitle(row.title)
    if (!key) {
      continue
    }

    counts.set(key, (counts.get(key) || 0) + 1)
    const distance = Math.abs(daysBetween(parseDate(row.date), targetDate))
    if (distance <= windowDays) {
      recentTitles.push(key)
    }

    if (row.date < date) {
      latestByTitle.set(key, { row, count: counts.get(key) || 1 })
    }
  }

  if (!latestByTitle.size) {
    for (const row of rows) {
      const key = normalizeTitle(row.title)
      if (key) {
        latestByTitle.set(key, { row, count: counts.get(key) || 1 })
      }
    }
  }

  const targetDay = targetDate.getUTCDay()
  const targetMonth = targetDate.getUTCMonth()
  const isWorkday = targetDay >= 1 && targetDay <= 5

  const suggestions = [...latestByTitle.values()]
    .filter((candidate) => !hasSimilarRecentWear(normalizeTitle(candidate.row.title), recentTitles))
    .map((candidate) => {
      const wornDate = parseDate(candidate.row.date)
      const daysSinceWorn = Math.abs(daysBetween(wornDate, targetDate))
      const sameMonth = wornDate.getUTCMonth() === targetMonth
      const sameWeekday = wornDate.getUTCDay() === targetDay
      const category = (candidate.row.category || "").toLowerCase()
      const workdayFit = isWorkday && ["work", "cooperate", "formal"].includes(category)
      const score = (sameMonth ? 28 : 0) + (sameWeekday ? 24 : 0) + (workdayFit ? 16 : 0) + Math.min(16, candidate.count * 2) + Math.min(16, Math.floor(daysSinceWorn / 30))
      const reasons = [
        "Not worn within " + windowDays + " days",
        "Last worn " + daysSinceWorn + " days ago on " + candidate.row.date
      ]

      if (sameMonth) { reasons.push("Worked in this month before") }
      if (sameWeekday) { reasons.push("Matches this weekday pattern") }
      if (workdayFit) { reasons.push("Fits a workday category") }

      return { entry: candidate.row, score, lastWornDate: candidate.row.date, daysSinceWorn, reasons }
    })
    .sort((a, b) => b.score - a.score || b.daysSinceWorn - a.daysSinceWorn || a.entry.title.localeCompare(b.entry.title))
    .slice(0, 5)

  return { date, windowDays, suggestions }
})

function normalizeTitle(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

function hasSimilarRecentWear(candidate: string, recentTitles: string[]) {
  return recentTitles.some((recent) => titleSimilarity(candidate, recent) >= 0.72)
}

function titleSimilarity(first: string, second: string) {
  if (first === second) {
    return 1
  }

  const firstTokens = new Set(first.split(" ").filter(Boolean))
  const secondTokens = new Set(second.split(" ").filter(Boolean))
  if (!firstTokens.size || !secondTokens.size) {
    return 0
  }

  const intersection = [...firstTokens].filter((token) => secondTokens.has(token)).length
  const union = new Set([...firstTokens, ...secondTokens]).size
  return intersection / union
}

function parseDate(date: string) {
  return new Date(date + "T00:00:00.000Z")
}

function daysBetween(first: Date, second: Date) {
  return Math.round((second.getTime() - first.getTime()) / 86400000)
}

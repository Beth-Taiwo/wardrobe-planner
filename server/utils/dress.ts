import { z } from "zod"

export const dressEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().trim().min(1).max(120),
  color: z.string().trim().max(40).optional().nullable(),
  category: z.string().trim().max(40).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  imageUrl: z.string().trim().url().optional().nullable(),
  sourceUrl: z.string().trim().url().optional().nullable()
})

export type DressEntryInput = z.infer<typeof dressEntrySchema>

export interface ImportPreview {
  entries: DressEntryInput[]
  skipped: Array<{ line: string, reason: string }>
  invalid: Array<{ line: string, reason: string }>
}

const monthNames = new Map([
  ["jan", 0], ["january", 0],
  ["feb", 1], ["february", 1],
  ["mar", 2], ["march", 2],
  ["apr", 3], ["april", 3],
  ["may", 4],
  ["jun", 5], ["june", 5],
  ["jul", 6], ["july", 6],
  ["aug", 7], ["august", 7],
  ["sep", 8], ["sept", 8], ["september", 8],
  ["oct", 9], ["october", 9],
  ["nov", 10], ["november", 10],
  ["dec", 11], ["december", 11]
])

const sectionPattern = /^(week\b|january$|february$|march$|april$|may$|june$|july$|august$|september$|october$|november$|december$|\d{4} calendar$)/i
const skipPattern = /^(wfh|work from home|remote|remote working|remote work|working remote|leave|sick leave|holiday|out of the office|remote & leave|-+)(\s|$)/i

export function cleanOptional(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export function parseKeepEntries(text: string, fallbackYear = new Date().getFullYear()) {
  return previewKeepEntries(text, fallbackYear).entries
}

export function previewKeepEntries(text: string, fallbackYear = new Date().getFullYear()): ImportPreview {
  const preview: ImportPreview = { entries: [], skipped: [], invalid: [] }
  const rows = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)

  for (const line of rows) {
    if (/^=+$/.test(line) || sectionPattern.test(line)) {
      continue
    }

    const result = parseLine(line, fallbackYear)
    if (result.entry) {
      preview.entries.push(result.entry)
    } else if (result.skipped) {
      preview.skipped.push({ line, reason: result.reason })
    } else if (result.invalid) {
      preview.invalid.push({ line, reason: result.reason })
    }
  }

  return preview
}

function parseLine(line: string, fallbackYear: number): { entry?: DressEntryInput, skipped?: true, invalid?: true, reason: string } {
  const iso = line.match(/^(\d{4}-\d{2}-\d{2})\s*[-:|]\s*(.+)$/)
  if (iso) {
    return fromDescription(iso[1], iso[2])
  }

  const trailingSlash = line.match(/^(.+?)\s*[—–-]+\s*(\d{1,2})[\/-]+(\d{1,2})(?:[\/-]?(\d{2,4}))?(?:\s*\([^)]*\))?$/)
  if (trailingSlash) {
    const day = Number(trailingSlash[2])
    const month = Number(trailingSlash[3]) - 1
    const year = normalizeYear(trailingSlash[4], fallbackYear)
    return fromDescription(toDateString(year, month, day), trailingSlash[1])
  }

  const slash = line.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\s*[-:|]\s*(.+)$/)
  if (slash) {
    const day = Number(slash[1])
    const month = Number(slash[2]) - 1
    const year = normalizeYear(slash[3], fallbackYear)
    return fromDescription(toDateString(year, month, day), slash[4])
  }

  const named = line.match(/^([A-Za-z]+)\s+(\d{1,2})(?:,?\s+(\d{4}))?\s*[-:|]\s*(.+)$/)
  if (named) {
    const month = monthNames.get(named[1].toLowerCase())
    if (month === undefined) {
      return { invalid: true, reason: "Unknown month name" }
    }

    const year = named[3] ? Number(named[3]) : fallbackYear
    return fromDescription(toDateString(year, month, Number(named[2])), named[4])
  }

  if (/\d{1,4}[\/-]\d{1,2}/.test(line)) {
    return { invalid: true, reason: "Could not read this date or outfit format" }
  }

  return { skipped: true, reason: "No dated outfit on this line" }
}

export function inferCategory(title: string) {
  const value = title.toLowerCase()

  if (/native|boubou|bubu|woodin|ankara|kimono/.test(value)) {
    return "Traditional"
  }

  if (/cooperate|corporate|formal|blazer|jacket/.test(value)) {
    return "Cooperate"
  }

  if (/shirt|blouse|trouser|trousers|skirt/.test(value)) {
    return "Work"
  }

  if (/gown|dress/.test(value)) {
    return "Formal"
  }

  if (/jeans|jean|jumpsuit|polo|round neck|sweat|crop/.test(value)) {
    return "Casual"
  }

  return null
}
function fromDescription(date: string | null, description: string): { entry?: DressEntryInput, skipped?: true, invalid?: true, reason: string } {
  if (!date) {
    return { invalid: true, reason: "Invalid date" }
  }

  const title = description.replace(/^\s*\d+\.\s*/, "").replace(/\s+/g, " ").trim()
  if (!title || skipPattern.test(title)) {
    return { skipped: true, reason: "Non-outfit day" }
  }

  const parsed = dressEntrySchema.safeParse({ date, title, category: inferCategory(title) })
  return parsed.success
    ? { entry: parsed.data, reason: "Imported" }
    : { invalid: true, reason: parsed.error.issues[0]?.message || "Invalid entry" }
}

function normalizeYear(value: string | undefined, fallbackYear: number) {
  if (!value) {
    return fallbackYear
  }

  const year = Number(value)
  return year < 100 ? 2000 + year : year
}

function toDateString(year: number, month: number, day: number) {
  if (!Number.isInteger(year) || month < 0 || month > 11 || day < 1 || day > 31) {
    return null
  }

  const date = new Date(Date.UTC(year, month, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month || date.getUTCDate() !== day) {
    return null
  }

  return date.toISOString().slice(0, 10)
}

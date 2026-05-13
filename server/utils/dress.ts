import { z } from 'zod'

export const dressEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().trim().min(1).max(120),
  color: z.string().trim().max(40).optional().nullable(),
  category: z.string().trim().max(40).optional().nullable(),
  weather: z.string().trim().max(60).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  imageUrl: z.string().trim().url().optional().nullable(),
  sourceUrl: z.string().trim().url().optional().nullable()
})

export type DressEntryInput = z.infer<typeof dressEntrySchema>

const monthNames = new Map([
  ['jan', 0],
  ['january', 0],
  ['feb', 1],
  ['february', 1],
  ['mar', 2],
  ['march', 2],
  ['apr', 3],
  ['april', 3],
  ['may', 4],
  ['jun', 5],
  ['june', 5],
  ['jul', 6],
  ['july', 6],
  ['aug', 7],
  ['august', 7],
  ['sep', 8],
  ['sept', 8],
  ['september', 8],
  ['oct', 9],
  ['october', 9],
  ['nov', 10],
  ['november', 10],
  ['dec', 11],
  ['december', 11]
])

export function cleanOptional(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

export function parseKeepEntries(text: string, fallbackYear = new Date().getFullYear()) {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  return rows
    .map((line) => parseLine(line, fallbackYear))
    .filter((entry): entry is DressEntryInput => Boolean(entry))
}

function parseLine(line: string, fallbackYear: number): DressEntryInput | null {
  const iso = line.match(/^(\d{4}-\d{2}-\d{2})\s*[-:|]\s*(.+)$/)
  if (iso) {
    return fromDescription(iso[1], iso[2])
  }

  const trailingSlash = line.match(/^(.+?)\s*[—–-]\s*(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?$/)
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
      return null
    }

    const year = named[3] ? Number(named[3]) : fallbackYear
    return fromDescription(toDateString(year, month, Number(named[2])), named[4])
  }

  return null
}

function fromDescription(date: string, description: string): DressEntryInput | null {
  const parsed = dressEntrySchema.safeParse({
    date,
    title: description.trim()
  })

  return parsed.success ? parsed.data : null
}

function normalizeYear(value: string | undefined, fallbackYear: number) {
  if (!value) {
    return fallbackYear
  }

  const year = Number(value)
  return year < 100 ? 2000 + year : year
}

function toDateString(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month, day))
  return date.toISOString().slice(0, 10)
}

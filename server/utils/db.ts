import { Prisma, PrismaClient } from "@prisma/client"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"

type PrismaClientOrTransaction = PrismaClient | Prisma.TransactionClient

const databaseUrl = process.env.DATABASE_URL || "mysql://root:password@localhost:3306/wardrobe_planner"

const globalForPrisma = globalThis as typeof globalThis & {
  wardrobePrisma?: PrismaClient
}

const adapter = new PrismaMariaDb(databaseUrl)
export const prisma = globalForPrisma.wardrobePrisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.wardrobePrisma = prisma
}

const dressEntryInclude = {
  clothingItems: {
    include: {
      clothingItem: true
    }
  }
} satisfies Prisma.DressEntryInclude

const outfitPlanInclude = {
  outfitItems: {
    include: {
      clothingItem: true
    }
  }
} satisfies Prisma.OutfitPlanInclude

type DressEntryWithItems = Prisma.DressEntryGetPayload<{ include: typeof dressEntryInclude }>
type OutfitPlanWithItems = Prisma.OutfitPlanGetPayload<{ include: typeof outfitPlanInclude }>
type ClothingItemRecord = Prisma.ClothingItemGetPayload<object>

export interface DressEntryFilters {
  date?: string | null
  month?: string | null
  year?: string | null
  text?: string
  category?: string
  excludeDate?: string | null
  order?: "asc" | "desc"
}

interface DressEntryInput {
  date: string
  title: string
  color?: string | null
  category?: string | null
  notes?: string | null
  imageUrl?: string | null
  sourceUrl?: string | null
  clothingItemIds?: string[]
}

export interface OutfitPlanFilters {
  id?: string | null
  date?: string | null
  upcoming?: boolean
  limit?: number
}

interface OutfitPlanInput {
  date: string
  eventName: string
  prepNotes?: string | null
  clothingItemIds: string[]
}

export function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
}

export class OutfitPlanItemOwnershipError extends Error {
  constructor() {
    super("Choose at least one wardrobe piece you own.")
    this.name = "OutfitPlanItemOwnershipError"
  }
}

export function toClothingItem(row: ClothingItemRecord) {
  return {
    id: row.id,
    name: row.name,
    label: row.label,
    color: row.color,
    imageUrl: row.imageUrl,
    notes: row.notes,
    createdAt: formatDateTime(row.createdAt),
    updatedAt: formatDateTime(row.updatedAt)
  }
}

export function toDressEntry(row: DressEntryWithItems) {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    color: row.color,
    category: row.category,
    notes: row.notes,
    imageUrl: row.imageUrl,
    sourceUrl: row.sourceUrl,
    createdAt: formatDateTime(row.createdAt),
    updatedAt: formatDateTime(row.updatedAt),
    clothingItems: row.clothingItems
      .map((item) => toClothingItem(item.clothingItem))
      .sort((a, b) => a.label.localeCompare(b.label) || a.name.localeCompare(b.name))
  }
}

export function toOutfitPlan(row: OutfitPlanWithItems) {
  return {
    id: row.id,
    date: row.date,
    eventName: row.eventName,
    prepNotes: row.prepNotes,
    createdAt: formatDateTime(row.createdAt),
    updatedAt: formatDateTime(row.updatedAt),
    clothingItems: row.outfitItems
      .map((item) => toClothingItem(item.clothingItem))
      .sort((a, b) => a.label.localeCompare(b.label) || a.name.localeCompare(b.name))
  }
}

export async function listDressEntries(userId: string, filters: DressEntryFilters = {}) {
  const where = buildDressEntryWhere(userId, filters)
  const rows = await prisma.dressEntry.findMany({
    where,
    include: dressEntryInclude,
    orderBy: { date: filters.order || "asc" }
  })

  return rows.map(toDressEntry)
}

export async function upsertDressEntry(userId: string, entry: DressEntryInput) {
  return prisma.$transaction((tx) => upsertDressEntryWithClient(tx, userId, entry))
}

export async function updateDressEntry(userId: string, id: string, entry: DressEntryInput) {
  const saved = await prisma.$transaction(async (tx) => {
    const result = await tx.dressEntry.updateMany({
      where: { id, userId },
      data: {
        date: entry.date,
        title: entry.title,
        color: entry.color ?? null,
        category: entry.category ?? null,
        notes: entry.notes ?? null,
        imageUrl: entry.imageUrl ?? null,
        sourceUrl: entry.sourceUrl ?? undefined
      }
    })

    if (!result.count) {
      return null
    }

    await syncDressEntryItems(tx, userId, id, entry.clothingItemIds || [])
    return findDressByDate(userId, entry.date, tx)
  })

  return saved
}

export async function findDressByDate(userId: string, date: string, client: PrismaClientOrTransaction = prisma) {
  const row = await client.dressEntry.findUnique({
    where: { userId_date: { userId, date } },
    include: dressEntryInclude
  })

  return row ? toDressEntry(row) : null
}

export async function deleteDressEntry(userId: string, id: string) {
  const result = await prisma.dressEntry.deleteMany({ where: { id, userId } })
  return result.count
}

export async function importDressEntries(userId: string, entries: DressEntryInput[]) {
  return prisma.$transaction(async (tx) => {
    const saved = []

    for (const entry of entries) {
      saved.push(await upsertDressEntryWithClient(tx, userId, entry))
    }

    return saved
  })
}

export async function listClothingItems(userId: string) {
  const rows = await prisma.clothingItem.findMany({
    where: { userId },
    orderBy: [{ label: "asc" }, { name: "asc" }]
  })

  return rows.map(toClothingItem)
}

export async function listOutfitPlans(userId: string, filters: OutfitPlanFilters = {}) {
  const AND: Prisma.OutfitPlanWhereInput[] = [{ userId }]

  if (filters.id) {
    AND.push({ id: filters.id })
  }

  if (filters.date && /^\d{4}-\d{2}-\d{2}$/.test(filters.date)) {
    AND.push({ date: filters.date })
  }

  if (filters.upcoming) {
    AND.push({ date: { gte: new Date().toISOString().slice(0, 10) } })
  }

  const rows = await prisma.outfitPlan.findMany({
    where: { AND },
    include: outfitPlanInclude,
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    take: filters.limit
  })

  return rows.map(toOutfitPlan)
}

export async function findOutfitPlan(userId: string, id: string) {
  const row = await prisma.outfitPlan.findFirst({
    where: { id, userId },
    include: outfitPlanInclude
  })

  return row ? toOutfitPlan(row) : null
}

export async function saveOutfitPlan(userId: string, id: string | null, plan: OutfitPlanInput) {
  return prisma.$transaction(async (tx) => {
    let planId = id

    if (planId) {
      const result = await tx.outfitPlan.updateMany({
        where: { id: planId, userId },
        data: {
          date: plan.date,
          eventName: plan.eventName,
          prepNotes: plan.prepNotes ?? null
        }
      })

      if (!result.count) {
        return null
      }
    } else {
      planId = crypto.randomUUID()
      await tx.outfitPlan.create({
        data: {
          id: planId,
          userId,
          date: plan.date,
          eventName: plan.eventName,
          prepNotes: plan.prepNotes ?? null
        }
      })
    }

    await syncOutfitPlanItems(tx, userId, planId, plan.clothingItemIds)
    const row = await tx.outfitPlan.findFirst({
      where: { id: planId, userId },
      include: outfitPlanInclude
    })

    return row ? toOutfitPlan(row) : null
  })
}

export async function deleteOutfitPlan(userId: string, id: string) {
  const result = await prisma.outfitPlan.deleteMany({ where: { id, userId } })
  return result.count
}

export async function createClothingItem(userId: string, item: {
  name: string
  label: string
  color?: string | null
  imageUrl?: string | null
  notes?: string | null
}) {
  const row = await prisma.clothingItem.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      name: item.name,
      label: item.label,
      color: item.color ?? null,
      imageUrl: item.imageUrl ?? null,
      notes: item.notes ?? null
    }
  })

  return toClothingItem(row)
}

export async function updateClothingItem(userId: string, id: string, item: {
  name: string
  label: string
  color?: string | null
  imageUrl?: string | null
  notes?: string | null
}) {
  const result = await prisma.clothingItem.updateMany({
    where: { id, userId },
    data: {
      name: item.name,
      label: item.label,
      color: item.color ?? null,
      imageUrl: item.imageUrl ?? null,
      notes: item.notes ?? null
    }
  })

  if (!result.count) {
    return null
  }

  const row = await prisma.clothingItem.findFirst({ where: { id, userId } })
  return row ? toClothingItem(row) : null
}

export async function deleteClothingItem(userId: string, id: string) {
  const result = await prisma.clothingItem.deleteMany({ where: { id, userId } })
  return result.count
}

export async function normalizeMissingDressCategories(userId: string, inferCategory: (title: string) => string | null | undefined) {
  const rows = await prisma.dressEntry.findMany({
    where: {
      userId,
      OR: [{ category: null }, { category: "" }]
    },
    orderBy: { date: "asc" }
  })
  const changes: Array<{ date: string, title: string, category: string }> = []

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      const category = inferCategory(row.title)
      if (!category) {
        continue
      }

      await tx.dressEntry.update({
        where: { id: row.id },
        data: { category }
      })
      changes.push({ date: row.date, title: row.title, category })
    }
  })

  return { updated: changes.length, changes }
}

export async function getDressStats(userId: string) {
  const rows = await prisma.dressEntry.findMany({ where: { userId }, orderBy: { date: "asc" } })
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

  return {
    totalEntries: rows.length,
    uniqueOutfits: byTitle.size,
    wornThisYear,
    uncategorized,
    mostWorn: [...byTitle.values()].sort((a, b) => b.count - a.count || b.lastWorn.localeCompare(a.lastWorn)).slice(0, 5),
    categories: [...byCategory.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count || a.category.localeCompare(b.category)),
    notWornThisYear: [...byTitle.values()].filter((item) => !item.lastWorn.startsWith(String(nowYear) + "-")).sort((a, b) => a.lastWorn.localeCompare(b.lastWorn)).slice(0, 5)
  }
}

function buildDressEntryWhere(userId: string, filters: DressEntryFilters): Prisma.DressEntryWhereInput {
  const AND: Prisma.DressEntryWhereInput[] = [{ userId }]

  if (filters.date && /^\d{4}-\d{2}-\d{2}$/.test(filters.date)) {
    AND.push({ date: filters.date })
  } else if (filters.month && /^\d{4}-\d{2}$/.test(filters.month)) {
    AND.push({ date: { startsWith: filters.month } })
  } else if (filters.year && /^\d{4}$/.test(filters.year)) {
    AND.push({ date: { startsWith: filters.year + "-" } })
  }

  if (filters.excludeDate && /^\d{4}-\d{2}-\d{2}$/.test(filters.excludeDate)) {
    AND.push({ date: { not: filters.excludeDate } })
  }

  if (filters.text) {
    AND.push({ title: { contains: filters.text } })
  }

  if (filters.category) {
    AND.push({ category: filters.category })
  }

  return AND.length ? { AND } : {}
}

async function upsertDressEntryWithClient(client: PrismaClientOrTransaction, userId: string, entry: DressEntryInput) {
  const row = await client.dressEntry.upsert({
    where: { userId_date: { userId, date: entry.date } },
    create: {
      id: crypto.randomUUID(),
      userId,
      date: entry.date,
      title: entry.title,
      color: entry.color ?? null,
      category: entry.category ?? null,
      notes: entry.notes ?? null,
      imageUrl: entry.imageUrl ?? null,
      sourceUrl: entry.sourceUrl ?? null
    },
    update: {
      title: entry.title,
      color: entry.color ?? null,
      category: entry.category ?? null,
      notes: entry.notes ?? null,
      imageUrl: entry.imageUrl ?? null,
      sourceUrl: entry.sourceUrl ?? undefined
    }
  })

  await syncDressEntryItems(client, userId, row.id, entry.clothingItemIds || [])
  return findDressByDate(userId, entry.date, client)
}

async function syncDressEntryItems(client: PrismaClientOrTransaction, userId: string, dressEntryId: string, clothingItemIds: string[]) {
  const uniqueIds = [...new Set(clothingItemIds.filter(Boolean))]
  await client.dressEntryItem.deleteMany({ where: { dressEntryId } })

  if (!uniqueIds.length) {
    return
  }

  const ownedItems = await client.clothingItem.findMany({
    where: { userId, id: { in: uniqueIds } },
    select: { id: true }
  })
  const ownedIds = new Set(ownedItems.map((item) => item.id))

  for (const clothingItemId of uniqueIds) {
    if (!ownedIds.has(clothingItemId)) {
      continue
    }

    await client.dressEntryItem.create({
      data: {
        dressEntryId,
        clothingItemId
      }
    })
  }
}

async function syncOutfitPlanItems(client: PrismaClientOrTransaction, userId: string, outfitPlanId: string, clothingItemIds: string[]) {
  const uniqueIds = [...new Set(clothingItemIds.filter(Boolean))]
  await client.outfitPlanItem.deleteMany({ where: { outfitPlanId } })

  if (!uniqueIds.length) {
    throw new OutfitPlanItemOwnershipError()
  }

  const ownedItems = await client.clothingItem.findMany({
    where: { userId, id: { in: uniqueIds } },
    select: { id: true }
  })
  const ownedIds = new Set(ownedItems.map((item) => item.id))

  if (!ownedIds.size || ownedIds.size !== uniqueIds.length) {
    throw new OutfitPlanItemOwnershipError()
  }

  for (const clothingItemId of uniqueIds) {
    await client.outfitPlanItem.create({
      data: {
        outfitPlanId,
        clothingItemId
      }
    })
  }
}

function formatDateTime(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value
}

function normalizeTitle(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

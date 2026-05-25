import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

const dbPath = join(process.cwd(), 'data', 'dress-calendar.db')
mkdirSync(dirname(dbPath), { recursive: true })

export const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS dress_entries (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    color TEXT,
    category TEXT,
    notes TEXT,
    image_url TEXT,
    source_url TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_dress_entries_date ON dress_entries(date);

  CREATE TABLE IF NOT EXISTS clothing_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    color TEXT,
    image_url TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_clothing_items_label ON clothing_items(label);

  CREATE TABLE IF NOT EXISTS dress_entry_items (
    dress_entry_id TEXT NOT NULL,
    clothing_item_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (dress_entry_id, clothing_item_id),
    FOREIGN KEY (dress_entry_id) REFERENCES dress_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (clothing_item_id) REFERENCES clothing_items(id) ON DELETE CASCADE
  );
`)

export interface DressEntryRow {
  id: string
  date: string
  title: string
  color: string | null
  category: string | null
  notes: string | null
  image_url: string | null
  source_url: string | null
  created_at: string
  updated_at: string
}

export interface ClothingItemRow {
  id: string
  name: string
  label: string
  color: string | null
  image_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export function toClothingItem(row: ClothingItemRow) {
  return {
    id: row.id,
    name: row.name,
    label: row.label,
    color: row.color,
    imageUrl: row.image_url,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export function toDressEntry(row: DressEntryRow) {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    color: row.color,
    category: row.category,
    notes: row.notes,
    imageUrl: row.image_url,
    sourceUrl: row.source_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    clothingItems: findClothingItemsForDress(row.id)
  }
}

export function upsertDressEntry(entry: {
  date: string
  title: string
  color?: string | null
  category?: string | null
  notes?: string | null
  imageUrl?: string | null
  sourceUrl?: string | null
  clothingItemIds?: string[]
}) {
  const id = crypto.randomUUID()

  db.transaction(() => {
    db.prepare(`
      INSERT INTO dress_entries (
        id, date, title, color, category, notes, image_url, source_url
      )
      VALUES (
        @id, @date, @title, @color, @category, @notes, @imageUrl, @sourceUrl
      )
      ON CONFLICT(date) DO UPDATE SET
        title = excluded.title,
        color = excluded.color,
        category = excluded.category,
        notes = excluded.notes,
        image_url = excluded.image_url,
        source_url = COALESCE(excluded.source_url, dress_entries.source_url),
        updated_at = CURRENT_TIMESTAMP
    `).run({
      id,
      date: entry.date,
      title: entry.title,
      color: entry.color ?? null,
      category: entry.category ?? null,
      notes: entry.notes ?? null,
      imageUrl: entry.imageUrl ?? null,
      sourceUrl: entry.sourceUrl ?? null
    })

    const saved = db.prepare('SELECT id FROM dress_entries WHERE date = ?').get(entry.date) as { id: string }
    syncDressEntryItems(saved.id, entry.clothingItemIds || [])
  })()

  return findDressByDate(entry.date)
}

export function updateDressEntry(id: string, entry: {
  date: string
  title: string
  color?: string | null
  category?: string | null
  notes?: string | null
  imageUrl?: string | null
  sourceUrl?: string | null
  clothingItemIds?: string[]
}) {
  db.transaction(() => {
    db.prepare(`
      UPDATE dress_entries SET
        date = @date,
        title = @title,
        color = @color,
        category = @category,
        notes = @notes,
        image_url = @imageUrl,
        source_url = COALESCE(@sourceUrl, source_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = @id
    `).run({
      id,
      date: entry.date,
      title: entry.title,
      color: entry.color ?? null,
      category: entry.category ?? null,
      notes: entry.notes ?? null,
      imageUrl: entry.imageUrl ?? null,
      sourceUrl: entry.sourceUrl ?? null
    })

    syncDressEntryItems(id, entry.clothingItemIds || [])
  })()

  return findDressByDate(entry.date)
}

export function findDressByDate(date: string) {
  const row = db
    .prepare('SELECT * FROM dress_entries WHERE date = ?')
    .get(date) as DressEntryRow | undefined

  return row ? toDressEntry(row) : null
}

export function listClothingItems() {
  const rows = db
    .prepare('SELECT * FROM clothing_items ORDER BY label ASC, name ASC')
    .all() as ClothingItemRow[]

  return rows.map(toClothingItem)
}

export function createClothingItem(item: {
  name: string
  label: string
  color?: string | null
  imageUrl?: string | null
  notes?: string | null
}) {
  const id = crypto.randomUUID()

  db.prepare(`
    INSERT INTO clothing_items (
      id, name, label, color, image_url, notes
    )
    VALUES (
      @id, @name, @label, @color, @imageUrl, @notes
    )
  `).run({
    id,
    name: item.name,
    label: item.label,
    color: item.color ?? null,
    imageUrl: item.imageUrl ?? null,
    notes: item.notes ?? null
  })

  const row = db.prepare('SELECT * FROM clothing_items WHERE id = ?').get(id) as ClothingItemRow
  return toClothingItem(row)
}

export function updateClothingItem(id: string, item: {
  name: string
  label: string
  color?: string | null
  imageUrl?: string | null
  notes?: string | null
}) {
  const result = db.prepare(`
    UPDATE clothing_items
    SET
      name = @name,
      label = @label,
      color = @color,
      image_url = @imageUrl,
      notes = @notes,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `).run({
    id,
    name: item.name,
    label: item.label,
    color: item.color ?? null,
    imageUrl: item.imageUrl ?? null,
    notes: item.notes ?? null
  })

  if (!result.changes) {
    return null
  }

  const row = db.prepare('SELECT * FROM clothing_items WHERE id = ?').get(id) as ClothingItemRow
  return toClothingItem(row)
}

export function deleteClothingItem(id: string) {
  return db.prepare('DELETE FROM clothing_items WHERE id = ?').run(id).changes
}

function findClothingItemsForDress(dressEntryId: string) {
  const rows = db.prepare(`
    SELECT clothing_items.*
    FROM clothing_items
    JOIN dress_entry_items ON dress_entry_items.clothing_item_id = clothing_items.id
    WHERE dress_entry_items.dress_entry_id = ?
    ORDER BY clothing_items.label ASC, clothing_items.name ASC
  `).all(dressEntryId) as ClothingItemRow[]

  return rows.map(toClothingItem)
}

function syncDressEntryItems(dressEntryId: string, clothingItemIds: string[]) {
  const uniqueIds = [...new Set(clothingItemIds.filter(Boolean))]
  db.prepare('DELETE FROM dress_entry_items WHERE dress_entry_id = ?').run(dressEntryId)

  const insert = db.prepare(`
    INSERT OR IGNORE INTO dress_entry_items (dress_entry_id, clothing_item_id)
    VALUES (?, ?)
  `)

  for (const clothingItemId of uniqueIds) {
    insert.run(dressEntryId, clothingItemId)
  }
}

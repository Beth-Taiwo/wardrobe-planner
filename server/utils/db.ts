import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

const dbPath = join(process.cwd(), 'data', 'dress-calendar.db')
mkdirSync(dirname(dbPath), { recursive: true })

export const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

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
    updatedAt: row.updated_at
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
}) {
  const id = crypto.randomUUID()

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
}) {
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

  return findDressByDate(entry.date)
}

export function findDressByDate(date: string) {
  const row = db
    .prepare('SELECT * FROM dress_entries WHERE date = ?')
    .get(date) as DressEntryRow | undefined

  return row ? toDressEntry(row) : null
}

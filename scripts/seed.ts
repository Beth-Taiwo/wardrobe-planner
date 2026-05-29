import { upsertDressEntry } from '../server/utils/db'

const entries = [
  {
    date: '2026-05-12',
    title: 'Soft linen dress',
    color: 'Sage',
    category: 'Casual',
    notes: 'Swap sandals for loafers if it rains.'
  },
  {
    date: '2026-05-13',
    title: 'Black wrap dress',
    color: 'Black',
    category: 'Work',
    notes: 'Gold hoops and low heels.'
  }
]

for (const entry of entries) {
  await upsertDressEntry(entry)
}

console.log(`Seeded ${entries.length} dress entries.`)

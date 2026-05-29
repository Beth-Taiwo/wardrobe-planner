import { hashPassword } from '../server/utils/auth'
import { prisma, upsertDressEntry } from '../server/utils/db'

const email = 'demo@example.com'
const user = await prisma.user.upsert({
  where: { normalizedEmail: email },
  create: {
    id: crypto.randomUUID(),
    email,
    normalizedEmail: email,
    displayName: 'Demo User',
    passwordHash: await hashPassword('password123')
  },
  update: {}
})

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
  await upsertDressEntry(user.id, entry)
}

console.log(`Seeded ${entries.length} dress entries for ${email}.`)

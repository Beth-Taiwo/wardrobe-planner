export interface ClothingItem {
  id: string
  name: string
  label: string
  color: string | null
  imageUrl: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface DressEntry {
  id: string
  date: string
  title: string
  color: string | null
  category: string | null
  notes: string | null
  imageUrl: string | null
  sourceUrl: string | null
  createdAt: string
  updatedAt: string
  clothingItems: ClothingItem[]
}

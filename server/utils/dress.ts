import { z } from "zod"

export const dressEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().trim().min(1).max(120),
  color: z.string().trim().max(40).optional().nullable(),
  category: z.string().trim().max(40).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  imageUrl: z.string().trim().url().optional().nullable(),
  clothingItemIds: z.array(z.string().trim().min(1)).optional().default([])
})

export type DressEntryInput = z.infer<typeof dressEntrySchema>

export const outfitPlanSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  eventName: z.string().trim().min(1).max(120),
  prepNotes: z.string().trim().max(1000).optional().nullable(),
  clothingItemIds: z.array(z.string().trim().min(1)).min(1)
})

export type OutfitPlanInput = z.infer<typeof outfitPlanSchema>

export function cleanOptional(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

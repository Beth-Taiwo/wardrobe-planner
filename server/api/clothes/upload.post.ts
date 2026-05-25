import { mkdir, writeFile } from "node:fs/promises"
import { extname, join } from "node:path"

const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"])

export default defineEventHandler(async (event) => {
  const parts = await readMultipartFormData(event)
  const file = parts?.find((part) => part.name === "file" && part.filename)

  if (!file || !file.data.length) {
    throw createError({ statusCode: 400, statusMessage: "Choose an image to upload." })
  }

  const extension = extname(file.filename || "").toLowerCase()
  if (!allowedExtensions.has(extension)) {
    throw createError({ statusCode: 400, statusMessage: "Upload a JPG, PNG, WEBP, or GIF image." })
  }

  const fileName = crypto.randomUUID() + extension
  const uploadDir = join(process.cwd(), "public", "uploads", "clothes")
  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, fileName), file.data)

  return { imageUrl: "/uploads/clothes/" + fileName }
})

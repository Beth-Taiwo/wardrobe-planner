import { normalizeMissingDressCategories } from "../../utils/db"
import { inferCategory } from "../../utils/dress"

export default defineEventHandler(() => normalizeMissingDressCategories(inferCategory))

import { defineConfig } from "prisma/config"

const databaseUrl = process.env.DATABASE_URL || "mysql://root:password@localhost:3306/wardrobe_planner"

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: databaseUrl
  }
})

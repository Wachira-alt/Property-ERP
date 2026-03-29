import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node --project prisma/tsconfig.seed.json prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL!,
  },
})
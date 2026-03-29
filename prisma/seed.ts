import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import * as dotenv from "dotenv"

dotenv.config({ path: ".env.local" })

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@property.com" },
  })

  if (existingAdmin) {
    console.log("Admin user already exists — skipping seed")
    return
  }

  const hashedPassword = await bcrypt.hash("Admin1234!", 12)

  const admin = await prisma.user.create({
    data: {
      name: "System Admin",
      email: "admin@property.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  })

  console.log(`Admin user created: ${admin.email}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
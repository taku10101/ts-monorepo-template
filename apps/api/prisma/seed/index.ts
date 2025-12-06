import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "../../src/generated/prisma/client"
import { seedTodos } from "./todos"

const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({ adapter })

async function main() {
	console.log("🌱 Starting database seeding...\n")

	try {
		// Seed todos
		await seedTodos(prisma)

		// Add more seed functions here for other domains
		// await seedUsers(prisma)
		// await seedProducts(prisma)

		console.log("\n✅ Database seeding completed successfully!")
	} catch (error) {
		console.error("\n❌ Error during database seeding:")
		console.error(error)
		throw error
	}
}

main()
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})

import { PrismaClient } from "@/generated/prisma"
import { seedTodos } from "./todos"

const prisma = new PrismaClient()

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

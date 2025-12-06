import type { PrismaClient } from "../../../src/generated/prisma/client"

export async function seedTodos(prisma: PrismaClient) {
	console.log("Seeding todos...")

	const todos = [
		{
			title: "Complete project setup",
			description: "Set up the development environment and initialize the project",
			completed: true,
		},
		{
			title: "Implement user authentication",
			description: "Add login and registration functionality",
			completed: false,
		},
		{
			title: "Create API endpoints",
			description: "Build RESTful API endpoints for CRUD operations",
			completed: false,
		},
		{
			title: "Write unit tests",
			description: "Add comprehensive test coverage for the application",
			completed: false,
		},
		{
			title: "Deploy to production",
			description: "Set up CI/CD pipeline and deploy the application",
			completed: false,
		},
	]

	// Clear existing todos
	await prisma.todo.deleteMany()

	// Create new todos
	await prisma.todo.createMany({
		data: todos,
	})

	const count = await prisma.todo.count()
	console.log(`✓ Seeded ${count} todos`)
}

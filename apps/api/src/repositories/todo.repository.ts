import type { Prisma, Todo } from "@prisma/client"
import { prisma } from "../lib/prisma"

export class TodoRepository {
	async findAll(): Promise<Todo[]> {
		return prisma.todo.findMany({
			orderBy: { createdAt: "desc" },
		})
	}

	async findById(id: string): Promise<Todo | null> {
		return prisma.todo.findUnique({
			where: { id },
		})
	}

	async create(data: Prisma.TodoCreateInput): Promise<Todo> {
		return prisma.todo.create({
			data,
		})
	}

	async update(id: string, data: Prisma.TodoUpdateInput): Promise<Todo> {
		return prisma.todo.update({
			where: { id },
			data,
		})
	}

	async delete(id: string): Promise<Todo> {
		return prisma.todo.delete({
			where: { id },
		})
	}
}

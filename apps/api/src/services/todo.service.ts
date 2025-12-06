import type { Todo } from "@/generated/prisma/client"
import { TodoRepository } from "../repositories/todo.repository"

export type CreateTodoInput = {
	title: string
	description?: string
}

export type UpdateTodoInput = {
	title?: string
	description?: string
	completed?: boolean
}

export class TodoService {
	private repository: TodoRepository

	constructor() {
		this.repository = new TodoRepository()
	}

	async getAllTodos(): Promise<Todo[]> {
		return this.repository.findAll()
	}

	async getTodoById(id: string): Promise<Todo | null> {
		return this.repository.findById(id)
	}

	async createTodo(input: CreateTodoInput): Promise<Todo> {
		return this.repository.create({
			title: input.title,
			description: input.description,
		})
	}

	async updateTodo(id: string, input: UpdateTodoInput): Promise<Todo> {
		const existingTodo = await this.repository.findById(id)
		if (!existingTodo) {
			throw new Error("Todo not found")
		}

		return this.repository.update(id, input)
	}

	async deleteTodo(id: string): Promise<Todo> {
		const existingTodo = await this.repository.findById(id)
		if (!existingTodo) {
			throw new Error("Todo not found")
		}

		return this.repository.delete(id)
	}
}

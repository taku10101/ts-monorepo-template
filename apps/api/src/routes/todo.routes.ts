import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import type { Todo } from "@/generated/prisma/client"
import { TodoService } from "../services/todo.service"

const TodoSchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string().nullable(),
	completed: z.boolean(),
	createdAt: z.string(),
	updatedAt: z.string(),
})

const serializeTodo = (todo: Todo) => ({
	...todo,
	createdAt: todo.createdAt.toISOString(),
	updatedAt: todo.updatedAt.toISOString(),
})

const CreateTodoSchema = z.object({
	title: z.string().min(1).openapi({ example: "買い物リスト" }),
	description: z.string().optional().openapi({ example: "牛乳とパンを買う" }),
})

const UpdateTodoSchema = z.object({
	title: z.string().min(1).optional().openapi({ example: "買い物リスト" }),
	description: z.string().optional().openapi({ example: "牛乳とパンを買う" }),
	completed: z.boolean().optional().openapi({ example: true }),
})

const ErrorSchema = z.object({
	error: z.string(),
})

const ParamsSchema = z.object({
	id: z.string().openapi({ param: { name: "id", in: "path" } }),
})

const listTodosRoute = createRoute({
	method: "get",
	path: "/todos",
	tags: ["Todos"],
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.array(TodoSchema),
				},
			},
			description: "List of all todos",
		},
	},
})

const getTodoRoute = createRoute({
	method: "get",
	path: "/todos/{id}",
	tags: ["Todos"],
	request: {
		params: ParamsSchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: TodoSchema,
				},
			},
			description: "Get a todo by ID",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "Todo not found",
		},
	},
})

const createTodoRoute = createRoute({
	method: "post",
	path: "/todos",
	tags: ["Todos"],
	request: {
		body: {
			content: {
				"application/json": {
					schema: CreateTodoSchema,
				},
			},
		},
	},
	responses: {
		201: {
			content: {
				"application/json": {
					schema: TodoSchema,
				},
			},
			description: "Todo created successfully",
		},
	},
})

const updateTodoRoute = createRoute({
	method: "put",
	path: "/todos/{id}",
	tags: ["Todos"],
	request: {
		params: ParamsSchema,
		body: {
			content: {
				"application/json": {
					schema: UpdateTodoSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: TodoSchema,
				},
			},
			description: "Todo updated successfully",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "Todo not found",
		},
	},
})

const deleteTodoRoute = createRoute({
	method: "delete",
	path: "/todos/{id}",
	tags: ["Todos"],
	request: {
		params: ParamsSchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: TodoSchema,
				},
			},
			description: "Todo deleted successfully",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "Todo not found",
		},
	},
})

export const todoRoutes = new OpenAPIHono()

const todoService = new TodoService()

todoRoutes.openapi(listTodosRoute, async (c) => {
	const todos = await todoService.getAllTodos()
	return c.json(todos.map(serializeTodo))
})

todoRoutes.openapi(getTodoRoute, async (c) => {
	const { id } = c.req.valid("param")
	const todo = await todoService.getTodoById(id)

	if (!todo) {
		return c.json({ error: "Todo not found" }, 404)
	}

	return c.json(serializeTodo(todo), 200)
})

todoRoutes.openapi(createTodoRoute, async (c) => {
	const body = c.req.valid("json")
	const todo = await todoService.createTodo(body)
	return c.json(serializeTodo(todo), 201)
})

todoRoutes.openapi(updateTodoRoute, async (c) => {
	const { id } = c.req.valid("param")
	const body = c.req.valid("json")

	try {
		const todo = await todoService.updateTodo(id, body)
		return c.json(serializeTodo(todo), 200)
	} catch (_error) {
		return c.json({ error: "Todo not found" }, 404)
	}
})

todoRoutes.openapi(deleteTodoRoute, async (c) => {
	const { id } = c.req.valid("param")

	try {
		const todo = await todoService.deleteTodo(id)
		return c.json(serializeTodo(todo), 200)
	} catch (_error) {
		return c.json({ error: "Todo not found" }, 404)
	}
})

import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import type { Todo } from "@/generated/prisma/client"
import { ErrorSchema, ParamsSchema } from "../schemas/common.schema"
import { CreateTodoSchema, TodoSchema, UpdateTodoSchema } from "../schemas/todo.schema"
import { TodoService } from "../services/todo.service"

const serializeTodo = (todo: Todo) => ({
	...todo,
	createdAt: todo.createdAt.toISOString(),
	updatedAt: todo.updatedAt.toISOString(),
})

const listTodosRoute = createRoute({
	method: "get",
	path: "/todos",
	summary: "Get all todos",
	description: "Retrieve a list of all todo items",
	tags: ["Todos"],
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.array(TodoSchema),
				},
			},
			description: "Successfully retrieved list of todos",
		},
	},
})

const getTodoRoute = createRoute({
	method: "get",
	path: "/todos/{id}",
	summary: "Get a todo by ID",
	description: "Retrieve a specific todo item by its unique identifier",
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
			description: "Successfully retrieved todo",
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
	summary: "Create a new todo",
	description: "Create a new todo item with title and optional description",
	tags: ["Todos"],
	request: {
		body: {
			content: {
				"application/json": {
					schema: CreateTodoSchema,
				},
			},
			description: "Todo data to create",
			required: true,
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
	summary: "Update a todo",
	description: "Update an existing todo item by ID. All fields are optional.",
	tags: ["Todos"],
	request: {
		params: ParamsSchema,
		body: {
			content: {
				"application/json": {
					schema: UpdateTodoSchema,
				},
			},
			description: "Todo data to update",
			required: true,
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
	summary: "Delete a todo",
	description: "Delete an existing todo item by ID",
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

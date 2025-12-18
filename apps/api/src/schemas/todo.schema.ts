import { z } from "@hono/zod-openapi"

export const TodoSchema = z
	.object({
		id: z.string().openapi({
			description: "Todo ID",
			example: "cm4u1x2y30000k8l9a1b2c3d4",
		}),
		title: z.string().openapi({
			description: "Todo title",
			example: "買い物リスト",
		}),
		description: z.string().nullable().openapi({
			description: "Todo description",
			example: "牛乳とパンを買う",
		}),
		completed: z.boolean().openapi({
			description: "Completion status",
			example: false,
		}),
		createdAt: z.string().openapi({
			description: "Created timestamp",
			example: "2025-01-15T10:30:00.000Z",
		}),
		updatedAt: z.string().openapi({
			description: "Updated timestamp",
			example: "2025-01-15T10:30:00.000Z",
		}),
	})
	.openapi("Todo")

export const CreateTodoSchema = z
	.object({
		title: z.string().min(1).openapi({
			description: "Todo title",
			example: "買い物リスト",
		}),
		description: z.string().optional().openapi({
			description: "Todo description (optional)",
			example: "牛乳とパンを買う",
		}),
	})
	.openapi("CreateTodo")

export const UpdateTodoSchema = z
	.object({
		title: z.string().min(1).optional().openapi({
			description: "Todo title",
			example: "買い物リスト（更新）",
		}),
		description: z.string().optional().openapi({
			description: "Todo description",
			example: "牛乳、パン、卵を買う",
		}),
		completed: z.boolean().optional().openapi({
			description: "Completion status",
			example: true,
		}),
	})
	.openapi("UpdateTodo")

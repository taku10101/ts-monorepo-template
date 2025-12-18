import { z } from "@hono/zod-openapi"

export const ErrorSchema = z
	.object({
		error: z.string().openapi({
			description: "Error message",
			example: "Todo not found",
		}),
	})
	.openapi("Error")

export const ParamsSchema = z.object({
	id: z
		.string()
		.min(3)
		.openapi({
			param: {
				name: "id",
				in: "path",
			},
			description: "Todo ID",
			example: "cm4u1x2y30000k8l9a1b2c3d4",
		}),
})

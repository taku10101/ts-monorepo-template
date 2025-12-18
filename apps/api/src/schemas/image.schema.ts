import { z } from "@hono/zod-openapi"

export const ImageUploadResponseSchema = z
	.object({
		objectName: z.string().openapi({
			description: "Object name in storage",
			example: "images/user123/profile.jpg",
		}),
		url: z.string().url().openapi({
			description: "Presigned URL for accessing the image",
			example: "http://localhost:9000/images/images/user123/profile.jpg?...",
		}),
		contentType: z.string().openapi({
			description: "Content type of the uploaded image",
			example: "image/jpeg",
		}),
		size: z.number().openapi({
			description: "File size in bytes",
			example: 102400,
		}),
	})
	.openapi("ImageUploadResponse")

export const ImageDeleteResponseSchema = z
	.object({
		message: z.string().openapi({
			description: "Success message",
			example: "Image deleted successfully",
		}),
		objectName: z.string().openapi({
			description: "Deleted object name",
			example: "images/user123/profile.jpg",
		}),
	})
	.openapi("ImageDeleteResponse")

export const ImagePathQuerySchema = z.object({
	path: z
		.string()
		.min(1)
		.openapi({
			description: "Image path in storage (e.g., user123/profile.jpg)",
			example: "user123/profile.jpg",
			param: {
				name: "path",
				in: "query",
			},
		}),
})

export const ImagePathParamsSchema = z.object({
	path: z
		.string()
		.min(1)
		.openapi({
			param: {
				name: "path",
				in: "path",
			},
			description: "Image path in storage (e.g., user123/profile.jpg)",
			example: "user123/profile.jpg",
		}),
})

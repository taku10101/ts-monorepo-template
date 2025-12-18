import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi"
import { ErrorSchema } from "../schemas/common.schema"
import {
	ImageDeleteResponseSchema,
	ImagePathParamsSchema,
	ImageUploadResponseSchema,
} from "../schemas/image.schema"
import { createStorageService } from "../services/s3-storage.service"

const BUCKET_NAME = "images"
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"]
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const uploadImageRoute = createRoute({
	method: "post",
	path: "/images",
	summary: "Upload an image",
	description: "Upload an image file to storage. Supports JPEG, PNG, GIF, and WebP formats.",
	tags: ["Images"],
	request: {
		body: {
			content: {
				"multipart/form-data": {
					schema: z.object({
						file: z.instanceof(File).openapi({
							description: "Image file to upload",
							type: "string",
							format: "binary",
						}),
						path: z.string().optional().openapi({
							description: "Optional custom path (e.g., user123/profile.jpg)",
							example: "user123/profile.jpg",
						}),
					}),
				},
			},
			required: true,
		},
	},
	responses: {
		201: {
			content: {
				"application/json": {
					schema: ImageUploadResponseSchema,
				},
			},
			description: "Image uploaded successfully",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "Invalid request (no file, invalid type, or file too large)",
		},
	},
})

const getImageRoute = createRoute({
	method: "get",
	path: "/images/{path}",
	summary: "Get an image",
	description: "Retrieve an image by its path. Returns the image binary data.",
	tags: ["Images"],
	request: {
		params: ImagePathParamsSchema,
	},
	responses: {
		200: {
			content: {
				"image/jpeg": {
					schema: z.instanceof(Blob).openapi({
						type: "string",
						format: "binary",
					}),
				},
				"image/png": {
					schema: z.instanceof(Blob).openapi({
						type: "string",
						format: "binary",
					}),
				},
				"image/gif": {
					schema: z.instanceof(Blob).openapi({
						type: "string",
						format: "binary",
					}),
				},
				"image/webp": {
					schema: z.instanceof(Blob).openapi({
						type: "string",
						format: "binary",
					}),
				},
			},
			description: "Image retrieved successfully",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "Image not found",
		},
	},
})

const deleteImageRoute = createRoute({
	method: "delete",
	path: "/images/{path}",
	summary: "Delete an image",
	description: "Delete an image by its path",
	tags: ["Images"],
	request: {
		params: ImagePathParamsSchema,
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: ImageDeleteResponseSchema,
				},
			},
			description: "Image deleted successfully",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorSchema,
				},
			},
			description: "Image not found",
		},
	},
})

export const imageRoutes = new OpenAPIHono()

const storageService = createStorageService()

imageRoutes.openapi(uploadImageRoute, async (c) => {
	const formData = await c.req.formData()
	const file = formData.get("file")
	const customPath = formData.get("path")

	if (!file || !(file instanceof File)) {
		return c.json({ error: "No file provided" }, 400)
	}

	// Validate file type
	if (!ALLOWED_TYPES.includes(file.type)) {
		return c.json(
			{
				error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(", ")}`,
			},
			400
		)
	}

	// Validate file size
	if (file.size > MAX_FILE_SIZE) {
		return c.json(
			{
				error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
			},
			400
		)
	}

	// Generate object name
	const timestamp = Date.now()
	const extension = file.name.split(".").pop() || "jpg"
	const objectName = customPath
		? (customPath as string)
		: `uploads/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`

	// Convert File to Buffer
	const arrayBuffer = await file.arrayBuffer()
	const buffer = Buffer.from(arrayBuffer)

	// Upload to storage
	await storageService.uploadFile(BUCKET_NAME, objectName, buffer, file.type)

	// Generate presigned URL
	const url = await storageService.getPresignedUrl(BUCKET_NAME, objectName, 3600)

	return c.json(
		{
			objectName,
			url,
			contentType: file.type,
			size: file.size,
		},
		201
	)
})

imageRoutes.openapi(getImageRoute, async (c) => {
	const { path } = c.req.valid("param")
	// Decode the path to handle URL-encoded slashes
	const decodedPath = decodeURIComponent(path)

	try {
		const buffer = await storageService.downloadFile(BUCKET_NAME, decodedPath)

		// Determine content type from file extension
		const extension = decodedPath.split(".").pop()?.toLowerCase()
		const contentType =
			extension === "png"
				? "image/png"
				: extension === "gif"
					? "image/gif"
					: extension === "webp"
						? "image/webp"
						: "image/jpeg"

		return new Response(buffer, {
			headers: {
				"Content-Type": contentType,
				"Cache-Control": "public, max-age=31536000",
			},
		})
	} catch (error) {
		return c.json({ error: "Image not found" }, 404)
	}
})

imageRoutes.openapi(deleteImageRoute, async (c) => {
	const { path } = c.req.valid("param")
	// Decode the path to handle URL-encoded slashes
	const decodedPath = decodeURIComponent(path)

	try {
		await storageService.deleteFile(BUCKET_NAME, decodedPath)

		return c.json(
			{
				message: "Image deleted successfully",
				objectName: decodedPath,
			},
			200
		)
	} catch (error) {
		return c.json({ error: "Image not found" }, 404)
	}
})

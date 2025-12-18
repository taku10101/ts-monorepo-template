import { serve } from "@hono/node-server"
import { swaggerUI } from "@hono/swagger-ui"
import { OpenAPIHono } from "@hono/zod-openapi"
import { cors } from "hono/cors"
import { imageRoutes } from "./routes/image.routes"
import { todoRoutes } from "./routes/todo.routes"

const app = new OpenAPIHono()

app.use("/*", cors())

app.get("/", (c) => {
	return c.json({
		message: "Todo API with Hono + OpenAPI",
		timestamp: new Date().toISOString(),
		docs: "/ui",
	})
})

app.get("/health", (c) => {
	return c.json({
		status: "ok",
		uptime: process.uptime(),
	})
})

app.route("/api", todoRoutes)
app.route("/api", imageRoutes)

app.doc("/doc", {
	openapi: "3.0.0",
	info: {
		version: "1.0.0",
		title: "Todo API",
	},
})

app.get("/ui", swaggerUI({ url: "/doc" }))

const port = 3001
console.log(`Server is running on http://localhost:${port}`)
console.log(`OpenAPI documentation: http://localhost:${port}/ui`)

serve({
	fetch: app.fetch,
	port,
})

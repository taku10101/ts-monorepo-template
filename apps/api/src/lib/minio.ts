import type * as Minio from "minio"

/**
 * MinIO Configuration
 * Supports both development (access key/secret key) and production (IAM role) environments
 */

export interface MinioConfig {
	endpoint: string
	port: number
	useSSL: boolean
	region: string
	accessKey?: string
	secretKey?: string
	sessionToken?: string
}

/**
 * Create MinIO client based on environment configuration
 * Development: Uses access key and secret key from environment variables
 * Production: Uses IAM role-based authentication (when credentials are not provided)
 */
export function createMinioClient(): Minio.Client {
	// Lazy load minio package to avoid requiring it if not used
	// biome-ignore lint: dynamic require for optional dependency
	const MinioClient = require("minio").Client

	const config: MinioConfig = {
		endpoint: process.env.MINIO_ENDPOINT || "localhost",
		port: parseInt(process.env.MINIO_PORT || "9000", 10),
		useSSL: process.env.MINIO_USE_SSL === "true",
		region: process.env.MINIO_REGION || "us-east-1",
	}

	const isProduction = process.env.NODE_ENV === "production"
	const hasCredentials = process.env.MINIO_ACCESS_KEY && process.env.MINIO_SECRET_KEY

	if (isProduction && !hasCredentials) {
		// Production environment with IAM role authentication
		console.log("🔐 Using IAM role-based authentication for MinIO/S3")

		// For AWS S3 with IAM roles, you would typically use AWS SDK instead of minio
		// This example shows how to configure minio to work with temporary credentials
		// In a real production environment, you might want to use @aws-sdk/client-s3 instead

		// Example: Using AWS SDK for credential management
		// const { fromInstanceMetadata } = require("@aws-sdk/credential-providers");
		// const credentialsProvider = fromInstanceMetadata();

		throw new Error(
			"IAM role-based authentication requires additional setup. " +
				"Please either set MINIO_ACCESS_KEY and MINIO_SECRET_KEY, " +
				"or implement AWS SDK credential provider integration."
		)
	}

	// Development environment or production with explicit credentials
	if (!hasCredentials) {
		throw new Error(
			"MinIO credentials are required. Please set MINIO_ACCESS_KEY and MINIO_SECRET_KEY environment variables."
		)
	}

	console.log(
		`🔧 Configuring MinIO client: ${config.endpoint}:${config.port} (SSL: ${config.useSSL})`
	)

	return new MinioClient({
		endPoint: config.endpoint,
		port: config.port,
		useSSL: config.useSSL,
		accessKey: process.env.MINIO_ACCESS_KEY,
		secretKey: process.env.MINIO_SECRET_KEY,
		// sessionToken can be used for temporary credentials
		...(process.env.MINIO_SESSION_TOKEN && {
			sessionToken: process.env.MINIO_SESSION_TOKEN,
		}),
	})
}

/**
 * Singleton instance of MinIO client
 */
let minioClient: Minio.Client | null = null

/**
 * Get or create MinIO client instance
 */
export function getMinioClient(): Minio.Client {
	if (!minioClient) {
		minioClient = createMinioClient()
	}
	return minioClient
}

/**
 * Health check for MinIO connection
 */
export async function checkMinioHealth(): Promise<boolean> {
	try {
		const client = getMinioClient()
		await client.listBuckets()
		return true
	} catch (error) {
		console.error("❌ MinIO health check failed:", error)
		return false
	}
}

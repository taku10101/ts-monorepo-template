/**
 * AWS S3 Storage Service with IAM Role Support
 * This service is designed for production environments where IAM role-based authentication is preferred
 *
 * Prerequisites:
 * - @aws-sdk/client-s3 package installed
 * - @aws-sdk/credential-providers for IAM role authentication
 * - Running on AWS infrastructure (EC2, ECS, EKS, Lambda, etc.) with attached IAM role
 *
 * Usage:
 * 1. For development/local testing: Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
 * 2. For production: Attach IAM role to your compute resource (no keys needed)
 */

import type {
	CopyObjectCommand,
	CreateBucketCommand,
	DeleteObjectCommand,
	GetObjectCommand,
	GetObjectCommandOutput,
	HeadBucketCommand,
	ListObjectsV2Command,
	ListObjectsV2CommandOutput,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3"
import type { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import type { IStorageService } from "./storage.service"

/**
 * S3 Storage Service Implementation with IAM Role Support
 */
export class S3StorageService implements IStorageService {
	private client: S3Client
	private region: string
	private maxFileSize: number

	constructor(
		region: string = process.env.AWS_REGION || process.env.MINIO_REGION || "us-east-1",
		maxFileSize: number = parseInt(process.env.MINIO_MAX_FILE_SIZE || "10485760", 10) // Default: 10MB
	) {
		// Lazy load AWS SDK to avoid requiring it if not used
		// biome-ignore lint: dynamic require for optional dependency
		const { S3Client } = require("@aws-sdk/client-s3")

		const endpoint = process.env.MINIO_ENDPOINT
			? `${process.env.MINIO_USE_SSL === "true" ? "https" : "http"}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT || "9000"}`
			: undefined

		this.region = region
		this.maxFileSize = maxFileSize

		// Configure S3 client
		// When running on AWS with IAM role, credentials are automatically obtained
		// When running locally or with explicit credentials, use environment variables
		this.client = new S3Client({
			region: this.region,
			// For MinIO or custom S3-compatible endpoints
			...(endpoint && {
				endpoint,
				forcePathStyle: true, // Required for MinIO
			}),
			// Credentials are automatically loaded from:
			// 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
			// 2. IAM role (when running on AWS infrastructure)
			// 3. AWS credentials file (~/.aws/credentials)
		})

		console.log(
			`🔧 Configured S3 client with region: ${this.region}${endpoint ? ` and endpoint: ${endpoint}` : " (AWS S3)"}`
		)
	}

	/**
	 * Upload a file to S3
	 */
	async uploadFile(
		bucketName: string,
		objectName: string,
		buffer: Buffer,
		contentType: string
	): Promise<string> {
		if (buffer.length > this.maxFileSize) {
			throw new Error(
				`File size (${buffer.length} bytes) exceeds maximum allowed size (${this.maxFileSize} bytes)`
			)
		}

		await this.ensureBucket(bucketName)

		// biome-ignore lint: dynamic require for optional dependency
		const { PutObjectCommand } = require("@aws-sdk/client-s3")

		const command = new PutObjectCommand({
			Bucket: bucketName,
			Key: objectName,
			Body: buffer,
			ContentType: contentType,
		})

		await this.client.send(command)
		return objectName
	}

	/**
	 * Download a file from S3
	 */
	async downloadFile(bucketName: string, objectName: string): Promise<Buffer> {
		// biome-ignore lint: dynamic require for optional dependency
		const { GetObjectCommand } = require("@aws-sdk/client-s3")

		const command = new GetObjectCommand({
			Bucket: bucketName,
			Key: objectName,
		})

		const response = (await this.client.send(command)) as GetObjectCommandOutput

		if (!response.Body) {
			throw new Error("Empty response body")
		}

		// Convert stream to buffer
		const chunks: Uint8Array[] = []

		// biome-ignore lint: Stream types compatibility
		for await (const chunk of response.Body as any) {
			chunks.push(chunk)
		}

		return Buffer.concat(chunks)
	}

	/**
	 * Delete a file from S3
	 */
	async deleteFile(bucketName: string, objectName: string): Promise<void> {
		// biome-ignore lint: dynamic require for optional dependency
		const { DeleteObjectCommand } = require("@aws-sdk/client-s3")

		const command = new DeleteObjectCommand({
			Bucket: bucketName,
			Key: objectName,
		})

		await this.client.send(command)
	}

	/**
	 * Get a presigned URL for temporary file access
	 */
	async getPresignedUrl(
		bucketName: string,
		objectName: string,
		expirySeconds: number = 3600
	): Promise<string> {
		// biome-ignore lint: dynamic require for optional dependency
		const { GetObjectCommand } = require("@aws-sdk/client-s3")
		// biome-ignore lint: dynamic require for optional dependency
		const { getSignedUrl } = require("@aws-sdk/s3-request-presigner")

		const command = new GetObjectCommand({
			Bucket: bucketName,
			Key: objectName,
		})

		return await getSignedUrl(this.client, command, {
			expiresIn: expirySeconds,
		})
	}

	/**
	 * Ensure bucket exists, create if it doesn't
	 */
	async ensureBucket(bucketName: string): Promise<void> {
		// biome-ignore lint: dynamic require for optional dependency
		const { HeadBucketCommand, CreateBucketCommand } = require("@aws-sdk/client-s3")

		try {
			const command = new HeadBucketCommand({ Bucket: bucketName })
			await this.client.send(command)
		} catch (error) {
			// Bucket doesn't exist, create it
			const createCommand = new CreateBucketCommand({
				Bucket: bucketName,
				CreateBucketConfiguration:
					this.region !== "us-east-1" ? { LocationConstraint: this.region } : undefined,
			})
			await this.client.send(createCommand)
			console.log(`✅ Created bucket: ${bucketName}`)
		}
	}

	/**
	 * Health check for S3 connection
	 */
	async healthCheck(): Promise<boolean> {
		try {
			// biome-ignore lint: dynamic require for optional dependency
			const { ListBucketsCommand } = require("@aws-sdk/client-s3")
			const command = new ListBucketsCommand({})
			await this.client.send(command)
			return true
		} catch (error) {
			console.error("❌ S3 health check failed:", error)
			return false
		}
	}

	/**
	 * List all objects in a bucket with optional prefix filter
	 */
	async listObjects(bucketName: string, prefix?: string): Promise<any[]> {
		// biome-ignore lint: dynamic require for optional dependency
		const { ListObjectsV2Command } = require("@aws-sdk/client-s3")

		const command = new ListObjectsV2Command({
			Bucket: bucketName,
			Prefix: prefix,
		})

		const response = (await this.client.send(command)) as ListObjectsV2CommandOutput
		return response.Contents || []
	}

	/**
	 * Copy an object within S3
	 */
	async copyObject(
		sourceBucket: string,
		sourceObject: string,
		destBucket: string,
		destObject: string
	): Promise<void> {
		// biome-ignore lint: dynamic require for optional dependency
		const { CopyObjectCommand } = require("@aws-sdk/client-s3")

		const command = new CopyObjectCommand({
			CopySource: `/${sourceBucket}/${sourceObject}`,
			Bucket: destBucket,
			Key: destObject,
		})

		await this.client.send(command)
	}
}

/**
 * Factory function to create storage service based on environment
 * Uses S3StorageService for production (IAM role support)
 * Uses MinioStorageService for development (access key/secret key)
 */
export function createStorageService(): IStorageService {
	const useS3 = process.env.STORAGE_BACKEND === "s3"
	const isProduction = process.env.NODE_ENV === "production"

	if (useS3 || isProduction) {
		console.log("📦 Using S3 Storage Service (IAM role support enabled)")
		return new S3StorageService()
	}

	console.log("📦 Using MinIO Storage Service (development mode)")
	// biome-ignore lint: dynamic require for optional dependency
	const { MinioStorageService } = require("./storage.service")
	return new MinioStorageService()
}

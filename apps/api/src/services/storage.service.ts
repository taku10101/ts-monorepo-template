import type * as Minio from "minio"
import { getMinioClient } from "@/lib/minio"

/**
 * Storage service interface
 */
export interface IStorageService {
	uploadFile(
		bucketName: string,
		objectName: string,
		buffer: Buffer,
		contentType: string
	): Promise<string>
	downloadFile(bucketName: string, objectName: string): Promise<Buffer>
	deleteFile(bucketName: string, objectName: string): Promise<void>
	getPresignedUrl(bucketName: string, objectName: string, expirySeconds?: number): Promise<string>
	ensureBucket(bucketName: string): Promise<void>
	healthCheck(): Promise<boolean>
}

/**
 * MinIO Storage Service Implementation
 * Provides file upload, download, delete, and presigned URL generation
 */
export class MinioStorageService implements IStorageService {
	private client: Minio.Client
	private region: string
	private maxFileSize: number

	constructor(
		region: string = process.env.MINIO_REGION || "us-east-1",
		maxFileSize: number = parseInt(process.env.MINIO_MAX_FILE_SIZE || "10485760", 10) // Default: 10MB
	) {
		this.client = getMinioClient()
		this.region = region
		this.maxFileSize = maxFileSize
	}

	/**
	 * Upload a file to MinIO
	 * @throws Error if file size exceeds maximum allowed size
	 */
	async uploadFile(
		bucketName: string,
		objectName: string,
		buffer: Buffer,
		contentType: string
	): Promise<string> {
		// Check file size limit
		if (buffer.length > this.maxFileSize) {
			throw new Error(
				`File size (${buffer.length} bytes) exceeds maximum allowed size (${this.maxFileSize} bytes)`
			)
		}

		await this.ensureBucket(bucketName)

		const metadata = {
			"Content-Type": contentType,
		}

		await this.client.putObject(bucketName, objectName, buffer, buffer.length, metadata)

		return objectName
	}

	/**
	 * Download a file from MinIO
	 * @returns Buffer containing the file data
	 */
	async downloadFile(bucketName: string, objectName: string): Promise<Buffer> {
		const stream = await this.client.getObject(bucketName, objectName)

		return new Promise((resolve, reject) => {
			const chunks: Buffer[] = []
			stream.on("data", (chunk: Buffer) => chunks.push(chunk))
			stream.on("end", () => resolve(Buffer.concat(chunks)))
			stream.on("error", reject)
		})
	}

	/**
	 * Delete a file from MinIO
	 */
	async deleteFile(bucketName: string, objectName: string): Promise<void> {
		await this.client.removeObject(bucketName, objectName)
	}

	/**
	 * Get a presigned URL for temporary file access
	 * @param expirySeconds URL expiration time in seconds (default: 1 hour)
	 * @returns Presigned URL string
	 */
	async getPresignedUrl(
		bucketName: string,
		objectName: string,
		expirySeconds: number = 3600
	): Promise<string> {
		return await this.client.presignedGetObject(bucketName, objectName, expirySeconds)
	}

	/**
	 * Ensure bucket exists, create if it doesn't
	 */
	async ensureBucket(bucketName: string): Promise<void> {
		const exists = await this.client.bucketExists(bucketName)
		if (!exists) {
			await this.client.makeBucket(bucketName, this.region)
			console.log(`✅ Created bucket: ${bucketName}`)
		}
	}

	/**
	 * Health check for MinIO connection
	 * @returns true if connection is healthy, false otherwise
	 */
	async healthCheck(): Promise<boolean> {
		try {
			// Try to list buckets as a simple health check
			await this.client.listBuckets()
			return true
		} catch (error) {
			console.error("❌ MinIO health check failed:", error)
			return false
		}
	}

	/**
	 * List all objects in a bucket with optional prefix filter
	 */
	async listObjects(bucketName: string, prefix?: string): Promise<Minio.BucketItem[]> {
		const objects: Minio.BucketItem[] = []
		const stream = this.client.listObjects(bucketName, prefix, true)

		return new Promise((resolve, reject) => {
			stream.on("data", (obj: Minio.BucketItem) => objects.push(obj))
			stream.on("end", () => resolve(objects))
			stream.on("error", reject)
		})
	}

	/**
	 * Copy an object within MinIO
	 */
	async copyObject(
		sourceBucket: string,
		sourceObject: string,
		destBucket: string,
		destObject: string
	): Promise<void> {
		const conds = new (require("minio").CopyConditions)()
		await this.client.copyObject(destBucket, destObject, `/${sourceBucket}/${sourceObject}`, conds)
	}
}

/**
 * Singleton instance of storage service
 */
let storageServiceInstance: MinioStorageService | null = null

/**
 * Get or create storage service instance
 */
export function getStorageService(): MinioStorageService {
	if (!storageServiceInstance) {
		storageServiceInstance = new MinioStorageService()
	}
	return storageServiceInstance
}

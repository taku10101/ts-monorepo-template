/**
 * Image API Integration Tests
 *
 * Prerequisites:
 * 1. MinIO must be running (docker compose up -d minio)
 * 2. API server must be running (pnpm dev)
 * 3. Environment variables must be set (MINIO_ENDPOINT, MINIO_ACCESS_KEY, etc.)
 *
 * Run this test:
 * cd apps/api
 * tsx src/tests/image.test.ts
 */

const API_BASE_URL = "http://localhost:3001"

interface TestResult {
	name: string
	passed: boolean
	error?: string
}

const results: TestResult[] = []

function assert(condition: boolean, message: string) {
	if (!condition) {
		throw new Error(message)
	}
}

/**
 * Create a test image buffer (1x1 PNG)
 */
function createTestImage(): { buffer: ArrayBuffer; contentType: string; filename: string } {
	// 1x1 red pixel PNG
	const buffer = Uint8Array.from(
		atob(
			"iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=="
		)
	)

	return { buffer: buffer.buffer, contentType: "image/png", filename: "test.png" }
}

/**
 * Test 1: Upload an image
 */
async function testUploadImage(): Promise<string> {
	console.log("🧪 Test 1: Upload an image")

	const testImage = createTestImage()
	const formData = new FormData()
	const blob = new Blob([testImage.buffer], { type: testImage.contentType })
	formData.append("file", blob, testImage.filename)
	formData.append("path", `test/${Date.now()}-${testImage.filename}`)

	const response = await fetch(`${API_BASE_URL}/api/images`, {
		method: "POST",
		body: formData,
	})

	assert(response.status === 201, `Expected status 201, got ${response.status}`)

	const data = await response.json()

	assert(data.objectName, "Response should contain objectName")
	assert(data.url, "Response should contain url")
	assert(data.contentType === testImage.contentType, "Content type should match")
	assert(data.size > 0, "Size should be greater than 0")

	console.log("✅ Image uploaded successfully")
	console.log(`   Object name: ${data.objectName}`)
	console.log(`   URL: ${data.url}`)

	results.push({ name: "Upload Image", passed: true })
	return data.objectName
}

/**
 * Test 2: Get an image
 */
async function testGetImage(objectName: string): Promise<void> {
	console.log("\n🧪 Test 2: Get an image")

	// URL encode the path to handle slashes
	const encodedPath = encodeURIComponent(objectName)
	const response = await fetch(`${API_BASE_URL}/api/images/${encodedPath}`)

	assert(response.status === 200, `Expected status 200, got ${response.status}`)

	const contentType = response.headers.get("content-type")
	const isImageType = contentType?.startsWith("image/") ?? false
	assert(isImageType, `Content type should be image/*, got ${contentType}`)

	const buffer = await response.arrayBuffer()
	assert(buffer.byteLength > 0, "Image buffer should not be empty")

	console.log("✅ Image retrieved successfully")
	console.log(`   Content type: ${contentType}`)
	console.log(`   Size: ${buffer.byteLength} bytes`)

	results.push({ name: "Get Image", passed: true })
}

/**
 * Test 3: Delete an image
 */
async function testDeleteImage(objectName: string): Promise<void> {
	console.log("\n🧪 Test 3: Delete an image")

	// URL encode the path to handle slashes
	const encodedPath = encodeURIComponent(objectName)
	const response = await fetch(`${API_BASE_URL}/api/images/${encodedPath}`, {
		method: "DELETE",
	})

	assert(response.status === 200, `Expected status 200, got ${response.status}`)

	const data = await response.json()

	assert(data.message, "Response should contain message")
	assert(data.objectName === objectName, "Deleted object name should match")

	console.log("✅ Image deleted successfully")
	console.log(`   Message: ${data.message}`)

	results.push({ name: "Delete Image", passed: true })
}

/**
 * Test 4: Get a non-existent image (should return 404)
 */
async function testGetNonExistentImage(): Promise<void> {
	console.log("\n🧪 Test 4: Get a non-existent image (should return 404)")

	const response = await fetch(`${API_BASE_URL}/api/images/nonexistent.jpg`)

	assert(response.status === 404, `Expected status 404, got ${response.status}`)

	const data = await response.json()
	assert(data.error, "Response should contain error message")

	console.log("✅ 404 error returned as expected")
	console.log(`   Error: ${data.error}`)

	results.push({ name: "Get Non-Existent Image", passed: true })
}

/**
 * Test 5: Upload invalid file type (should return 400)
 */
async function testUploadInvalidFileType(): Promise<void> {
	console.log("\n🧪 Test 5: Upload invalid file type (should return 400)")

	const formData = new FormData()
	const blob = new Blob(["invalid content"], { type: "text/plain" })
	formData.append("file", blob, "test.txt")

	const response = await fetch(`${API_BASE_URL}/api/images`, {
		method: "POST",
		body: formData,
	})

	assert(response.status === 400, `Expected status 400, got ${response.status}`)

	const data = await response.json()
	assert(data.error, "Response should contain error message")

	console.log("✅ 400 error returned as expected")
	console.log(`   Error: ${data.error}`)

	results.push({ name: "Upload Invalid File Type", passed: true })
}

/**
 * Test 6: Upload without file (should return 400)
 */
async function testUploadWithoutFile(): Promise<void> {
	console.log("\n🧪 Test 6: Upload without file (should return 400)")

	const formData = new FormData()

	const response = await fetch(`${API_BASE_URL}/api/images`, {
		method: "POST",
		body: formData,
	})

	assert(response.status === 400, `Expected status 400, got ${response.status}`)

	const data = await response.json()
	assert(data.error, "Response should contain error message")

	console.log("✅ 400 error returned as expected")
	console.log(`   Error: ${data.error}`)

	results.push({ name: "Upload Without File", passed: true })
}

/**
 * Print test summary
 */
function printSummary() {
	console.log(`\n${"=".repeat(50)}`)
	console.log("📊 TEST SUMMARY")
	console.log("=".repeat(50))

	const passed = results.filter((r) => r.passed).length
	const failed = results.filter((r) => !r.passed).length

	for (const result of results) {
		const icon = result.passed ? "✅" : "❌"
		console.log(`${icon} ${result.name}`)
		if (result.error) {
			console.log(`   Error: ${result.error}`)
		}
	}

	console.log(`\n${"-".repeat(50)}`)
	console.log(`Total: ${results.length}`)
	console.log(`Passed: ${passed}`)
	console.log(`Failed: ${failed}`)
	console.log("=".repeat(50))

	if (failed > 0) {
		throw new Error(`${failed} test(s) failed.`)
	}
}

/**
 * Run all tests
 */
async function runTests() {
	console.log("🚀 Starting Image API Integration Tests\n")
	console.log(`API Base URL: ${API_BASE_URL}`)
	console.log(`${"=".repeat(50)}\n`)

	try {
		// Test upload, get, and delete in sequence
		const objectName = await testUploadImage()
		await testGetImage(objectName)
		await testDeleteImage(objectName)

		// Test error cases
		await testGetNonExistentImage()
		await testUploadInvalidFileType()
		await testUploadWithoutFile()

		printSummary()
	} catch (error) {
		console.error("\n❌ Test failed:", error)
		results.push({
			name: "Current Test",
			passed: false,
			error: error instanceof Error ? error.message : String(error),
		})
		printSummary()
	}
}

// Run tests
runTests()

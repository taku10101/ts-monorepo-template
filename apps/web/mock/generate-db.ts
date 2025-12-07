#!/usr/bin/env tsx
import { writeFileSync } from "node:fs"
import { resolve } from "node:path"
import { generateMockDataWithIds } from "./generators/base-generator"
import { generateComment, generatePost, generateUser } from "./generators/example-generators"
import type { DatabaseSchema } from "./types/base"

/**
 * Generate mock database
 * Add your own generators here
 */
function generateDatabase(): DatabaseSchema {
	return {
		users: generateMockDataWithIds(generateUser, { count: 10 }),
		posts: generateMockDataWithIds(generatePost, { count: 20 }),
		comments: generateMockDataWithIds(generateComment, { count: 50 }),
	}
}

/**
 * Main function
 */
function main() {
	const db = generateDatabase()
	const outputPath = resolve(__dirname, "data", "db.json")

	writeFileSync(outputPath, JSON.stringify(db, null, 2), "utf-8")

	console.log(`✅ Mock database generated at: ${outputPath}`)
	console.log(`📊 Statistics:`)
	for (const [key, value] of Object.entries(db)) {
		console.log(`   - ${key}: ${value.length} items`)
	}
}

main()

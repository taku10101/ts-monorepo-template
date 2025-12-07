import type { MockConfig, MockGenerator } from "../types/base"

/**
 * Generate an array of mock data using a generator function
 */
export function generateMockData<T>(generator: MockGenerator<T>, config: MockConfig = {}): T[] {
	const { count = 10 } = config
	return Array.from({ length: count }, () => generator())
}

/**
 * Generate a single mock item with an auto-incrementing ID
 */
export function withId<T>(generator: MockGenerator<T>, id: number): T & { id: number } {
	return {
		id,
		...generator(),
	}
}

/**
 * Generate mock data with sequential IDs
 */
export function generateMockDataWithIds<T>(
	generator: MockGenerator<T>,
	config: MockConfig = {}
): (T & { id: number })[] {
	const { count = 10 } = config
	return Array.from({ length: count }, (_, i) => withId(generator, i + 1))
}

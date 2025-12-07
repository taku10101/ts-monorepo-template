/**
 * Base types for mock data generation
 */

export type MockGenerator<T> = () => T

export interface MockConfig {
	count?: number
}

export interface DatabaseSchema {
	[key: string]: unknown[]
}

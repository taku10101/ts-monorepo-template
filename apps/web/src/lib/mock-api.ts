/**
 * Mock API client
 * Simple wrapper for fetch to interact with json-server
 */

const MOCK_API_URL = "http://localhost:3002"

export class MockApiError extends Error {
	constructor(
		message: string,
		public status: number
	) {
		super(message)
		this.name = "MockApiError"
	}
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
	const url = `${MOCK_API_URL}${endpoint}`

	try {
		const response = await fetch(url, {
			...options,
			headers: {
				"Content-Type": "application/json",
				...options?.headers,
			},
		})

		if (!response.ok) {
			throw new MockApiError(`HTTP error! status: ${response.status}`, response.status)
		}

		return await response.json()
	} catch (error) {
		if (error instanceof MockApiError) {
			throw error
		}
		throw new MockApiError(`Failed to fetch: ${error}`, 0)
	}
}

/**
 * GET request
 */
export async function get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
	const searchParams = params ? `?${new URLSearchParams(params).toString()}` : ""
	return request<T>(`${endpoint}${searchParams}`)
}

/**
 * POST request
 */
export async function post<T, D = unknown>(endpoint: string, data: D): Promise<T> {
	return request<T>(endpoint, {
		method: "POST",
		body: JSON.stringify(data),
	})
}

/**
 * PUT request
 */
export async function put<T, D = unknown>(endpoint: string, data: D): Promise<T> {
	return request<T>(endpoint, {
		method: "PUT",
		body: JSON.stringify(data),
	})
}

/**
 * PATCH request
 */
export async function patch<T, D = unknown>(endpoint: string, data: Partial<D>): Promise<T> {
	return request<T>(endpoint, {
		method: "PATCH",
		body: JSON.stringify(data),
	})
}

/**
 * DELETE request
 */
export async function del(endpoint: string): Promise<void> {
	await request(endpoint, {
		method: "DELETE",
	})
}

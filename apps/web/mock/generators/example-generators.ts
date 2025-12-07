import { faker } from "@faker-js/faker"
import type { MockGenerator } from "../types/base"

/**
 * Example interfaces for demonstration
 */

export interface User {
	id: number
	name: string
	email: string
	avatar?: string
	createdAt: string
}

export interface Post {
	id: number
	title: string
	content: string
	authorId: number
	published: boolean
	createdAt: string
	updatedAt: string
}

export interface Comment {
	id: number
	postId: number
	userId: number
	content: string
	createdAt: string
}

/**
 * Generators for each type
 */

export const generateUser: MockGenerator<Omit<User, "id">> = () => ({
	name: faker.person.fullName(),
	email: faker.internet.email(),
	avatar: faker.image.avatar(),
	createdAt: faker.date.past().toISOString(),
})

export const generatePost: MockGenerator<Omit<Post, "id">> = () => ({
	title: faker.lorem.sentence(),
	content: faker.lorem.paragraphs(3),
	authorId: faker.number.int({ min: 1, max: 10 }),
	published: faker.datatype.boolean(),
	createdAt: faker.date.past().toISOString(),
	updatedAt: faker.date.recent().toISOString(),
})

export const generateComment: MockGenerator<Omit<Comment, "id">> = () => ({
	postId: faker.number.int({ min: 1, max: 20 }),
	userId: faker.number.int({ min: 1, max: 10 }),
	content: faker.lorem.paragraph(),
	createdAt: faker.date.recent().toISOString(),
})

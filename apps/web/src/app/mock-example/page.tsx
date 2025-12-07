"use client"

import { useEffect, useState } from "react"
import { get } from "@/lib/mock-api"
import type { Post, User } from "@/mock/types"

export default function MockExamplePage() {
	const [users, setUsers] = useState<User[]>([])
	const [posts, setPosts] = useState<Post[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		async function fetchData() {
			try {
				setLoading(true)
				const [usersData, postsData] = await Promise.all([
					get<User[]>("/users"),
					get<Post[]>("/posts", { _limit: "5" }),
				])
				setUsers(usersData)
				setPosts(postsData)
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to fetch data")
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [])

	if (loading) {
		return (
			<div className="container mx-auto p-8">
				<p>Loading...</p>
			</div>
		)
	}

	if (error) {
		return (
			<div className="container mx-auto p-8">
				<div className="rounded-lg border border-red-500 bg-red-50 p-4">
					<p className="font-semibold text-red-900">Error</p>
					<p className="text-sm text-red-700">{error}</p>
					<p className="mt-2 text-sm text-red-600">
						Make sure the mock server is running: pnpm mock:dev
					</p>
				</div>
			</div>
		)
	}

	return (
		<div className="container mx-auto space-y-8 p-8">
			<div>
				<h1 className="mb-2 text-3xl font-bold">Mock API Example</h1>
				<p className="text-gray-600">
					This page demonstrates fetching data from the json-server mock API
				</p>
			</div>

			<section>
				<h2 className="mb-4 text-2xl font-semibold">Users</h2>
				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{users.map((user) => (
						<div key={user.id} className="rounded-lg border p-4">
							<div className="flex items-center gap-3">
								{user.avatar && (
									<img src={user.avatar} alt={user.name} className="size-12 rounded-full" />
								)}
								<div>
									<p className="font-semibold">{user.name}</p>
									<p className="text-sm text-gray-600">{user.email}</p>
								</div>
							</div>
						</div>
					))}
				</div>
			</section>

			<section>
				<h2 className="mb-4 text-2xl font-semibold">Recent Posts (5)</h2>
				<div className="space-y-4">
					{posts.map((post) => (
						<div key={post.id} className="rounded-lg border p-4">
							<h3 className="mb-2 font-semibold">{post.title}</h3>
							<p className="text-sm text-gray-700">{post.content}</p>
							<div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
								<span>Author ID: {post.authorId}</span>
								<span>•</span>
								<span>{post.published ? "Published" : "Draft"}</span>
							</div>
						</div>
					))}
				</div>
			</section>

			<section className="rounded-lg bg-gray-50 p-4">
				<h3 className="mb-2 font-semibold">API Endpoints</h3>
				<ul className="space-y-1 text-sm">
					<li>
						<code className="rounded bg-gray-200 px-1">GET /users</code> - All users
					</li>
					<li>
						<code className="rounded bg-gray-200 px-1">GET /posts</code> - All posts
					</li>
					<li>
						<code className="rounded bg-gray-200 px-1">GET /comments</code> - All comments
					</li>
					<li>
						<code className="rounded bg-gray-200 px-1">GET /users/1</code> - Single user
					</li>
					<li>
						<code className="rounded bg-gray-200 px-1">GET /posts?_limit=5</code> - First 5 posts
					</li>
				</ul>
			</section>
		</div>
	)
}

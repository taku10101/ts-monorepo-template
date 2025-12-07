import Link from "next/link"
import { auth } from "@/auth"
import { SignOutButton } from "@/components/signout-button"

export default async function Home() {
	const session = await auth()

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="w-full max-w-md space-y-8 rounded-lg border p-8">
				<div className="text-center">
					<h1 className="font-bold text-3xl">Welcome</h1>
				</div>

				{session?.user ? (
					<div className="space-y-4">
						<div className="rounded-lg bg-green-50 p-4">
							<p className="font-medium text-green-900">Signed in as:</p>
							<p className="text-green-700 text-sm">{session.user.email}</p>
							{session.user.name && (
								<p className="text-green-700 text-sm">Name: {session.user.name}</p>
							)}
						</div>
						<SignOutButton />
					</div>
				) : (
					<div className="space-y-4">
						<p className="text-center text-gray-600">You are not signed in</p>
						<div className="flex gap-4">
							<Link
								href="/auth/signin"
								className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-center text-white hover:bg-blue-700"
							>
								Sign In
							</Link>
							<Link
								href="/auth/signup"
								className="flex-1 rounded-md border border-blue-600 px-4 py-2 text-center text-blue-600 hover:bg-blue-50"
							>
								Sign Up
							</Link>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

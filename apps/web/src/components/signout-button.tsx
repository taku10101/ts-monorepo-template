"use client"

import { signOut } from "next-auth/react"

export function SignOutButton() {
	return (
		<button
			type="button"
			onClick={() => signOut()}
			className="w-full rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
		>
			Sign Out
		</button>
	)
}

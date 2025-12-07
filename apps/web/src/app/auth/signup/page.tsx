"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const signUpSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	email: z.string().email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
})

type SignUpForm = z.infer<typeof signUpSchema>

export default function SignUpPage() {
	const router = useRouter()

	const form = useForm<SignUpForm>({
		resolver: zodResolver(signUpSchema),
		defaultValues: {
			name: "",
			email: "",
			password: "",
		},
	})

	async function onSubmit(data: SignUpForm) {
		try {
			const response = await fetch("/api/auth/signup", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(data),
			})

			const result = await response.json()

			if (!response.ok) {
				alert(result.error || "Failed to create account")
			} else {
				alert("Account created successfully! Please sign in.")
				router.push("/auth/signin")
			}
		} catch (error) {
			console.error("Sign up error:", error)
			alert("An error occurred. Please try again.")
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="w-full max-w-md space-y-8 rounded-lg border p-8">
				<div className="text-center">
					<h2 className="font-bold text-3xl">Sign Up</h2>
					<p className="mt-2 text-gray-600 text-sm">Create a new account</p>
				</div>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input type="text" placeholder="Enter your name" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input type="email" placeholder="Enter your email" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password</FormLabel>
									<FormControl>
										<Input
											type="password"
											placeholder="Enter your password (min 8 characters)"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button type="submit" className="w-full">
							Sign Up
						</Button>
					</form>
				</Form>

				<div className="text-center text-sm">
					<span className="text-gray-600">Already have an account? </span>
					<Link href="/auth/signin" className="text-blue-600 hover:underline">
						Sign in
					</Link>
				</div>
			</div>
		</div>
	)
}

"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
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

const signInSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(8, "Password must be at least 8 characters"),
})

type SignInForm = z.infer<typeof signInSchema>

export default function SignInPage() {
	const router = useRouter()

	const form = useForm<SignInForm>({
		resolver: zodResolver(signInSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	})

	async function onSubmit(data: SignInForm) {
		try {
			const result = await signIn("credentials", {
				email: data.email,
				password: data.password,
				redirect: false,
			})

			if (result?.error) {
				alert("Invalid email or password")
			} else {
				router.push("/")
				router.refresh()
			}
		} catch (error) {
			console.error("Sign in error:", error)
			alert("An error occurred. Please try again.")
		}
	}

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="w-full max-w-md space-y-8 rounded-lg border p-8">
				<div className="text-center">
					<h2 className="text-3xl font-bold">Sign In</h2>
					<p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
				</div>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
										<Input type="password" placeholder="Enter your password" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button type="submit" className="w-full">
							Sign In
						</Button>
					</form>
				</Form>

				<div className="text-center text-sm">
					<span className="text-gray-600">Don't have an account? </span>
					<Link href="/auth/signup" className="text-blue-600 hover:underline">
						Sign up
					</Link>
				</div>
			</div>
		</div>
	)
}

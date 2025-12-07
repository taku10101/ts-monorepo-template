import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/components/auth-provider"

export const metadata: Metadata = {
	title: "Next.js + Hono Monorepo",
	description: "Next.js application in monorepo",
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="ja">
			<body>
				<AuthProvider>{children}</AuthProvider>
			</body>
		</html>
	)
}

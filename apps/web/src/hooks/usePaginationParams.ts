import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo } from "react"

export interface PaginationParams {
	page: number
	pageSize: number
	offset: number
}

export const usePaginationParams = (defaultPageSize = 10) => {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()

	const paginationParams: PaginationParams = useMemo(() => {
		const page = Math.max(1, Number(searchParams.get("page")) || 1)
		const pageSize = Math.max(1, Number(searchParams.get("pageSize")) || defaultPageSize)
		const offset = (page - 1) * pageSize

		return {
			page,
			pageSize,
			offset,
		}
	}, [searchParams, defaultPageSize])

	const updatePaginationParams = useCallback(
		(updates: Partial<{ page: number; pageSize: number }>) => {
			const newSearchParams = new URLSearchParams(searchParams?.toString())

			if (updates.page !== undefined) {
				newSearchParams.set("page", updates.page.toString())
			}

			if (updates.pageSize !== undefined) {
				newSearchParams.set("pageSize", updates.pageSize.toString())
				// ページサイズが変更された場合は、ページを1にリセット
				if (updates.page === undefined) {
					newSearchParams.set("page", "1")
				}
			}

			router.replace(`${pathname}?${newSearchParams.toString()}`)
		},
		[searchParams, router, pathname]
	)

	const setPage = useCallback(
		(page: number) => {
			updatePaginationParams({ page })
		},
		[updatePaginationParams]
	)

	const setPageSize = useCallback(
		(pageSize: number) => {
			updatePaginationParams({ pageSize })
		},
		[updatePaginationParams]
	)

	const resetPagination = useCallback(() => {
		const newSearchParams = new URLSearchParams(searchParams?.toString())
		newSearchParams.delete("page")
		newSearchParams.delete("pageSize")
		router.replace(`${pathname}?${newSearchParams.toString()}`)
	}, [searchParams, router, pathname])

	return {
		...paginationParams,
		setPage,
		setPageSize,
		updatePaginationParams,
		resetPagination,
	}
}

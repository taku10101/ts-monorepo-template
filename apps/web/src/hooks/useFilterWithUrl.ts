import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { buildQueryString, parseQueryParams } from "@/lib/filterUtils"

/**
 * URLクエリパラメータと同期するフィルター用カスタムフック
 *
 * @template T - フィルターオブジェクトの型
 * @param defaultValues - フィルターのデフォルト値
 * @returns フィルターの状態、セッター関数、リセット関数、個別更新関数
 *
 * @example
 * const { filters, setFilters, resetFilters, updateFilter } = useFilterWithUrl({
 *   searchQuery: "",
 *   status: "",
 * });
 *
 * // フィルター全体を更新
 * setFilters({ searchQuery: "test", status: "active" });
 *
 * // 個別のフィールドを更新
 * updateFilter("searchQuery", "test");
 *
 * // フィルターをリセット
 * resetFilters();
 */
export const useFilterWithUrl = <T extends Record<string, unknown>>(defaultValues: T) => {
	const searchParams = useSearchParams()
	const router = useRouter()
	const pathname = usePathname()

	// URLクエリパラメータから初期値を取得
	const initialFilters = searchParams ? parseQueryParams(searchParams) : {}

	// デフォルト値とURLパラメータをマージして初期状態を作成
	const [filters, setFilters] = useState<T>(() => {
		const merged = { ...defaultValues }
		for (const key in defaultValues) {
			if (initialFilters[key] !== undefined) {
				// 型に応じて変換
				const defaultValue = defaultValues[key]
				if (typeof defaultValue === "boolean") {
					;(merged as Record<string, unknown>)[key] = initialFilters[key] === "true"
				} else if (typeof defaultValue === "number") {
					;(merged as Record<string, unknown>)[key] = Number(initialFilters[key])
				} else {
					;(merged as Record<string, unknown>)[key] = initialFilters[key]
				}
			}
		}
		return merged
	})

	// フィルター値が変更されたらURLクエリパラメータを更新
	useEffect(() => {
		const params: Record<string, string | number | boolean | undefined | null> = {}
		for (const [key, value] of Object.entries(filters)) {
			// 空文字列やfalseのbooleanはURLパラメータに含めない
			if (value !== "" && value !== null && value !== undefined) {
				if (typeof value === "boolean") {
					params[key] = value ? "true" : undefined
				} else {
					params[key] = value as string | number
				}
			}
		}
		const queryString = buildQueryString(params)
		const newUrl = queryString ? `${pathname}?${queryString}` : pathname
		router.replace(newUrl)
	}, [filters, pathname, router])

	/**
	 * フィルターをデフォルト値にリセット
	 */
	const resetFilters = useCallback(() => {
		setFilters(defaultValues)
	}, [defaultValues])

	/**
	 * 個別のフィルターフィールドを更新
	 *
	 * @param key - 更新するフィールド名
	 * @param value - 新しい値
	 */
	const updateFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
		setFilters((prev) => ({
			...prev,
			[key]: value,
		}))
	}, [])

	return { filters, setFilters, resetFilters, updateFilter }
}

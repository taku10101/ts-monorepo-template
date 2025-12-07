import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { FC, ReactNode } from "react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { buildQueryParams } from "@/lib/filterUtils"
import { FilterField, type FilterFieldConfig } from "./FilterField"

// オブジェクトの浅い等価比較（プリミティブ値のみを想定）
const shallowEqual = (
	a: Record<string, unknown> | null,
	b: Record<string, unknown> | null
): boolean => {
	if (a === b) return true
	if (!a || !b) return false
	const aKeys = Object.keys(a)
	const bKeys = Object.keys(b)
	if (aKeys.length !== bKeys.length) return false
	for (const key of aKeys) {
		if (a[key] !== b[key]) return false
	}
	return true
}

export type FilterLayout = "grid" | "stack"

export interface GenericFilterProps {
	fields: FilterFieldConfig[]
	onFilterChange: (filters: Record<string, unknown>) => void
	onFieldChange?: (name: string, value: string | boolean) => void
	layout?: FilterLayout
	gridColumns?: number
	showSearchButton?: boolean
	searchButtonText?: string
	title?: string
	titleIcon?: ReactNode
	defaultValues?: Record<string, unknown>
	autoSubmit?: boolean
}

export const GenericFilter: FC<GenericFilterProps> = ({
	fields,
	onFilterChange,
	onFieldChange: onFieldChangeCallback,
	layout = "stack",
	gridColumns = 3,
	showSearchButton = true,
	searchButtonText = "検索",
	title,
	titleIcon,
	defaultValues = {},
	autoSubmit = false,
}) => {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const isFirstMount = useRef(true)
	const onFilterChangeRef = useRef(onFilterChange)
	const defaultValuesRef = useRef(defaultValues)
	const prevFiltersRef = useRef<Record<string, unknown> | null>(null)

	// autoSubmit=falseの場合に使用するローカルstate
	const [localValues, setLocalValues] = useState<Record<string, string | boolean>>({})

	// onFilterChangeの最新参照を保持
	useEffect(() => {
		onFilterChangeRef.current = onFilterChange
	}, [onFilterChange])

	// defaultValuesRefを更新
	useEffect(() => {
		defaultValuesRef.current = defaultValues
	}, [defaultValues])

	// 初回マウント時およびdefaultValuesやURLパラメータが変更されたときにローカルstateを初期化（autoSubmit=falseの場合）
	useEffect(() => {
		if (!autoSubmit) {
			const initialValues: Record<string, string | boolean> = {}

			// まずdefaultValuesから値を取得
			for (const [key, value] of Object.entries(defaultValues)) {
				if (value !== undefined && value !== null && value !== "") {
					initialValues[key] = value as string | boolean
				}
			}

			// 次にURLパラメータから値を取得（優先度が高い）
			for (const field of fields) {
				const paramValue = searchParams.get(field.name)
				if (paramValue !== null) {
					initialValues[field.name] = field.type === "checkbox" ? paramValue === "true" : paramValue
				}
			}

			setLocalValues(initialValues)
		}
	}, [defaultValues, searchParams, autoSubmit, fields])

	// searchParamsから各フィールドの値を取得（優先順位: ローカルstate(autoSubmit=false時) > URLパラメータ > defaultValues > field.defaultValue）
	const getFieldValue = useCallback(
		(field: FilterFieldConfig): string | boolean => {
			// autoSubmit=falseの場合、ローカルstateを優先
			if (!autoSubmit && field.name in localValues) {
				return localValues[field.name]
			}

			const paramValue = searchParams.get(field.name)
			if (paramValue !== null) {
				return field.type === "checkbox" ? paramValue === "true" : paramValue
			}
			if (defaultValuesRef.current[field.name] !== undefined) {
				return defaultValuesRef.current[field.name] as string | boolean
			}
			return field.defaultValue ?? (field.type === "checkbox" ? false : "")
		},
		[searchParams, autoSubmit, localValues]
	)

	// 現在のフィルター値を計算（onFilterChange用）
	const currentFilters = useMemo(() => {
		const filters: Record<string, unknown> = {}

		if (!autoSubmit) {
			// 検索ボタンモードの場合
			// フィルターフィールドのいずれかがURLパラメータに存在するかチェック
			const hasFilterParams = fields.some((field) => searchParams.get(field.name) !== null)

			if (hasFilterParams) {
				// URLパラメータから値を取得
				for (const field of fields) {
					const paramValue = searchParams.get(field.name)
					if (paramValue !== null && paramValue !== "") {
						const value = field.type === "checkbox" ? paramValue === "true" : paramValue
						if (typeof value === "boolean" && !value) {
							continue
						}
						filters[field.name] = value
					}
				}
			} else {
				// URLパラメータがない場合はローカルstateの値を使用
				for (const [key, value] of Object.entries(localValues)) {
					if (value !== undefined && value !== "" && value !== null) {
						if (typeof value === "boolean" && !value) {
							continue
						}
						filters[key] = value
					}
				}
			}
		} else {
			// 自動送信モードの場合、getFieldValueを使用
			for (const field of fields) {
				const value = getFieldValue(field)
				if (value !== undefined && value !== "" && value !== null) {
					if (typeof value === "boolean" && !value) {
						continue
					}
					filters[field.name] = value
				}
			}
		}

		return filters
	}, [fields, getFieldValue, autoSubmit, localValues, searchParams])

	// searchParamsが変更されたときにonFilterChangeを呼ぶ
	useEffect(() => {
		// 初回マウント時は、値がある場合のみ実行
		if (isFirstMount.current) {
			isFirstMount.current = false
			const hasAnyValue = Object.keys(currentFilters).length > 0
			if (!hasAnyValue) {
				return
			}
		}

		// 自動送信モードの場合は常に実行
		// 検索ボタンモードの場合は、フィルターパラメータが存在する時のみ実行
		const hasFilterParams = fields.some((field) => searchParams.get(field.name) !== null)

		if (autoSubmit || (!autoSubmit && hasFilterParams)) {
			// 前回と同じフィルターならスキップ（無限ループ防止）
			if (shallowEqual(prevFiltersRef.current, currentFilters)) {
				return
			}
			prevFiltersRef.current = currentFilters
			onFilterChangeRef.current(currentFilters)
		}
	}, [currentFilters, autoSubmit, searchParams, fields])

	const handleFieldChange = useCallback(
		(name: string, value: string | boolean) => {
			if (autoSubmit) {
				// 自動送信モードの場合は即座にURLパラメータを更新
				const newParams = new URLSearchParams(searchParams?.toString())

				if (value === "" || value === false || value === null || value === undefined) {
					newParams.delete(name)
				} else {
					newParams.set(name, String(value))
				}

				router.replace(`${pathname}?${newParams.toString()}`)
			} else {
				// 検索ボタンモードの場合はローカルstateのみ更新
				setLocalValues((prev) => {
					const next = { ...prev }

					// 空の値の場合は削除
					if (value === "" || value === false || value === null || value === undefined) {
						delete next[name]
					} else {
						next[name] = value
					}

					return next
				})
			}

			// onFieldChangeCallbackが設定されている場合は呼び出す
			if (onFieldChangeCallback) {
				onFieldChangeCallback(name, value)
			}
		},
		[searchParams, router, pathname, autoSubmit, onFieldChangeCallback]
	)

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault()

			if (!autoSubmit) {
				// 検索ボタンモードの場合、ローカルstateの値をURLパラメータに反映
				const newParams = new URLSearchParams(searchParams?.toString())

				// 既存のフィルターパラメータをクリア
				for (const field of fields) {
					newParams.delete(field.name)
				}

				// ローカルstateの値をURLパラメータに設定
				for (const [key, value] of Object.entries(localValues)) {
					if (value !== "" && value !== false) {
						newParams.set(key, String(value))
					}
				}

				router.replace(`${pathname}?${newParams.toString()}`)
				// URLパラメータが更新されたら、useEffectが自動的にonFilterChangeを呼び出す
			} else {
				// 自動送信モードの場合は即座にonFilterChangeを呼び出す
				onFilterChangeRef.current(currentFilters)
			}
		},
		[currentFilters, autoSubmit, searchParams, router, pathname, fields, localValues]
	)

	const handleReset = useCallback(() => {
		// ローカルstateをクリア（autoSubmit=falseの場合）
		if (!autoSubmit) {
			setLocalValues({})
		}

		// URLパラメータをクリア（既存のパラメータを保持しながらフィルターのみ削除）
		const newParams = new URLSearchParams(searchParams?.toString())
		for (const field of fields) {
			newParams.delete(field.name)
		}

		// Next.jsのrouterを使用してURLを更新
		router.replace(`${pathname}?${newParams.toString()}`)

		onFilterChangeRef.current({})
	}, [searchParams, router, pathname, fields, autoSubmit])

	const renderFields = () => {
		if (layout === "grid") {
			return (
				<div
					className="mx-auto grid max-w-[1400px] gap-3"
					style={{ gridTemplateColumns: `repeat(${gridColumns}, 1fr)` }}
				>
					{fields.map((field) => (
						<FilterField
							key={field.name}
							config={field}
							value={getFieldValue(field)}
							onChange={(value) => handleFieldChange(field.name, value)}
						/>
					))}
				</div>
			)
		}

		return (
			<div className="mx-auto flex max-w-[1400px] flex-col items-stretch gap-3">
				{fields.map((field) => (
					<FilterField
						key={field.name}
						config={field}
						value={getFieldValue(field)}
						onChange={(value) => handleFieldChange(field.name, value)}
					/>
				))}
			</div>
		)
	}

	return (
		<form onSubmit={handleSubmit} className="rounded-md border border-gray-200 bg-white p-4">
			{title && (
				<div className="mb-3 flex items-center gap-2">
					{titleIcon}
					<Label className="font-bold">{title}</Label>
				</div>
			)}

			{renderFields()}

			{showSearchButton && (
				<div className="mt-4 flex justify-center gap-3">
					<Button type="submit" className="min-w-[120px]">
						{searchButtonText}
					</Button>
					<Button type="button" variant="outline" onClick={handleReset} className="min-w-[120px]">
						リセット
					</Button>
				</div>
			)}
		</form>
	)
}

/**
 * フィルターデータをクエリパラメータに変換するヘルパー関数
 */
export const convertFiltersToQueryParams = (filters: Record<string, unknown>): URLSearchParams => {
	const params: Record<string, string | number | boolean | undefined | null> = {}

	for (const [key, value] of Object.entries(filters)) {
		if (typeof value === "string" || typeof value === "number") {
			params[key] = value
		} else if (typeof value === "boolean") {
			params[key] = value
		}
	}

	return buildQueryParams(params)
}

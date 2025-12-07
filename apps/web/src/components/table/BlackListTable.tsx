import type { ColumnDef } from "@tanstack/react-table"
import { useMemo } from "react"
import { createSelectColumn, DataTable } from "@/components/table/DataTable"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/lib/format/dateFormat"

export interface BlackListInterface {
	id: number
	category: "BLACKLIST" | "GRAYLIST" | "WATCHLIST"
	category_display: string
	full_name: string
	company_name?: string | null
	phone_number: string
	birth_date?: string | null
	reason_type_display: string
	created_at: string
}

interface BlackListTableProps {
	data: BlackListInterface[]
	onDetailClick?: (id: number) => void
	onEditClick?: (id: number) => void
	isLoading?: boolean
	selectedIds?: number[]
	onSelectionChange?: (ids: number[]) => void
	totalCount?: number
	pageIndex?: number
	pageSize?: number
	onPaginationChange?: (pagination: { pageIndex: number; pageSize: number }) => void
	hideEditButton?: boolean
	hideDetailButton?: boolean
	hideActionsColumn?: boolean
}

export const BlackListTable = ({
	data,
	onDetailClick,
	onEditClick,
	isLoading = false,
	selectedIds = [],
	onSelectionChange,
	totalCount = 0,
	pageIndex = 0,
	pageSize = 10,
	onPaginationChange,
	hideEditButton = false,
	hideDetailButton = false,
	hideActionsColumn = false,
}: BlackListTableProps) => {
	const columns = useMemo<ColumnDef<BlackListInterface>[]>(() => {
		const baseColumns: ColumnDef<BlackListInterface>[] = []

		// Selection column
		if (onSelectionChange) {
			baseColumns.push(createSelectColumn<BlackListInterface>())
		}

		// Data columns
		baseColumns.push(
			{
				accessorKey: "id",
				header: "ID",
				size: 80,
			},
			{
				accessorKey: "category",
				header: "区分",
				cell: ({ row }) => {
					const category = row.original.category
					const variantMap = {
						BLACKLIST: "destructive" as const,
						GRAYLIST: "secondary" as const,
						WATCHLIST: "warning" as const,
					}
					const labelMap = {
						BLACKLIST: "ブラック",
						GRAYLIST: "グレー",
						WATCHLIST: "要注意",
					}
					return <Badge variant={variantMap[category]}>{labelMap[category]}</Badge>
				},
				size: 100,
			},
			{
				accessorKey: "full_name",
				header: "氏名",
				size: 150,
			},
			{
				accessorKey: "company_name",
				header: "法人名",
				cell: ({ getValue }) => getValue() || "-",
				size: 150,
			},
			{
				accessorKey: "phone_number",
				header: "電話番号",
				size: 120,
			},
			{
				accessorKey: "birth_date",
				header: "生年月日",
				cell: ({ getValue }) => getValue() || "-",
				size: 120,
			},
			{
				accessorKey: "reason_type_display",
				header: "追加理由",
				size: 120,
			},
			{
				accessorKey: "created_at",
				header: "追加日時",
				cell: ({ getValue }) => formatDateTime(getValue() as string),
				size: 160,
			}
		)

		// Actions column
		if (!hideActionsColumn) {
			baseColumns.push({
				id: "actions",
				header: "操作",
				cell: ({ row }) => (
					<div className="flex gap-2">
						{!hideDetailButton && (
							<Button
								size="sm"
								variant="outline"
								onClick={() => onDetailClick?.(row.original.id)}
								disabled={isLoading}
							>
								詳細
							</Button>
						)}
						{!hideEditButton && (
							<Button
								size="sm"
								variant="outline"
								onClick={() => onEditClick?.(row.original.id)}
								disabled={isLoading}
							>
								編集
							</Button>
						)}
					</div>
				),
				enableSorting: false,
				size: 150,
			})
		}

		return baseColumns
	}, [
		onSelectionChange,
		isLoading,
		hideDetailButton,
		hideEditButton,
		hideActionsColumn,
		onDetailClick,
		onEditClick,
	])

	// Convert selectedIds to row selection state
	const rowSelection = useMemo(() => {
		if (!onSelectionChange) return {}
		return selectedIds.reduce(
			(acc, id) => {
				const rowIndex = data.findIndex((item) => item.id === id)
				if (rowIndex !== -1) {
					acc[rowIndex] = true
				}
				return acc
			},
			{} as Record<string, boolean>
		)
	}, [selectedIds, data, onSelectionChange])

	// Handle row selection change
	const handleRowSelectionChange = (newSelection: Record<string, boolean>) => {
		if (!onSelectionChange) return

		const newSelectedIds = Object.keys(newSelection)
			.filter((key) => newSelection[key])
			.map((key) => data[Number(key)]?.id)
			.filter(Boolean) as number[]

		onSelectionChange(newSelectedIds)
	}

	return (
		<DataTable
			columns={columns}
			data={data}
			pageSize={pageSize}
			pageIndex={pageIndex}
			pageCount={Math.ceil(totalCount / pageSize)}
			onPaginationChange={onPaginationChange}
			manualPagination={!!onPaginationChange}
			enableRowSelection={!!onSelectionChange}
			rowSelection={rowSelection}
			onRowSelectionChange={handleRowSelectionChange}
			getRowId={(row) => row.id.toString()}
			isLoading={isLoading}
			containerClassName="rounded-md border"
		/>
	)
}

import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	type PaginationState,
	type RowSelectionState,
	type TableOptions,
	useReactTable,
} from "@tanstack/react-table"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[]
	data: TData[]
	// Pagination
	pageSize?: number
	pageIndex?: number
	pageCount?: number
	onPaginationChange?: (pagination: PaginationState) => void
	manualPagination?: boolean
	// Row selection
	enableRowSelection?: boolean
	rowSelection?: RowSelectionState
	onRowSelectionChange?: (selection: RowSelectionState) => void
	getRowId?: (row: TData, index: number) => string
	// Loading state
	isLoading?: boolean
	// Additional table options
	tableOptions?: Partial<TableOptions<TData>>
	// Pagination controls customization
	showPaginationInfo?: boolean
	paginationInfoTemplate?: (params: {
		startIndex: number
		endIndex: number
		totalCount: number
	}) => React.ReactNode
	// Custom rendering
	renderEmpty?: () => React.ReactNode
	renderLoading?: () => React.ReactNode
	// Class customization
	className?: string
	tableClassName?: string
	containerClassName?: string
}

export function DataTable<TData, TValue>({
	columns,
	data,
	pageSize = 10,
	pageIndex = 0,
	pageCount,
	onPaginationChange,
	manualPagination = false,
	enableRowSelection = false,
	rowSelection = {},
	onRowSelectionChange,
	getRowId,
	isLoading = false,
	tableOptions,
	showPaginationInfo = true,
	paginationInfoTemplate,
	renderEmpty,
	renderLoading,
	className,
	tableClassName,
	containerClassName,
}: DataTableProps<TData, TValue>) {
	const [internalPagination, setInternalPagination] = React.useState<PaginationState>({
		pageIndex,
		pageSize,
	})

	const [internalRowSelection, setInternalRowSelection] =
		React.useState<RowSelectionState>(rowSelection)

	const pagination = onPaginationChange ? { pageIndex, pageSize } : internalPagination

	const rowSelectionState = onRowSelectionChange ? rowSelection : internalRowSelection

	const handlePaginationChange = React.useCallback(
		(updater: PaginationState | ((old: PaginationState) => PaginationState)) => {
			const newPagination = typeof updater === "function" ? updater(pagination) : updater
			if (onPaginationChange) {
				onPaginationChange(newPagination)
			} else {
				setInternalPagination(newPagination)
			}
		},
		[pagination, onPaginationChange]
	)

	const handleRowSelectionChange = React.useCallback(
		(updater: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => {
			const newSelection = typeof updater === "function" ? updater(rowSelectionState) : updater
			if (onRowSelectionChange) {
				onRowSelectionChange(newSelection)
			} else {
				setInternalRowSelection(newSelection)
			}
		},
		[rowSelectionState, onRowSelectionChange]
	)

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
		manualPagination,
		pageCount: pageCount ?? (manualPagination ? -1 : undefined),
		state: {
			pagination,
			rowSelection: enableRowSelection ? rowSelectionState : undefined,
		},
		onPaginationChange: handlePaginationChange,
		onRowSelectionChange: enableRowSelection ? handleRowSelectionChange : undefined,
		enableRowSelection,
		getRowId,
		...tableOptions,
	})

	const totalCount = manualPagination ? (pageCount ?? 0) * pageSize : data.length
	const startIndex = pagination.pageIndex * pageSize + 1
	const endIndex = Math.min((pagination.pageIndex + 1) * pageSize, totalCount)

	if (isLoading && renderLoading) {
		return <>{renderLoading()}</>
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="text-muted-foreground">読み込み中...</div>
			</div>
		)
	}

	if (data.length === 0 && renderEmpty) {
		return <>{renderEmpty()}</>
	}

	if (data.length === 0) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="text-muted-foreground">データがありません</div>
			</div>
		)
	}

	return (
		<div className={className}>
			<div className={containerClassName}>
				<Table className={tableClassName}>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id}>
										{header.isPlaceholder
											? null
											: flexRender(header.column.columnDef.header, header.getContext())}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows.map((row) => (
							<TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</TableCell>
								))}
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{/* Pagination */}
			<div className="flex items-center justify-between gap-2 px-2 py-4">
				{showPaginationInfo &&
					(paginationInfoTemplate ? (
						paginationInfoTemplate({ startIndex, endIndex, totalCount })
					) : (
						<div className="text-muted-foreground text-sm">
							{totalCount > 0 && `全 ${totalCount} 件中 ${startIndex} - ${endIndex} 件表示`}
						</div>
					))}

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.setPageIndex(0)}
						disabled={!table.getCanPreviousPage()}
					>
						最初
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.previousPage()}
						disabled={!table.getCanPreviousPage()}
					>
						前へ
					</Button>
					<div className="text-muted-foreground text-sm">
						{pagination.pageIndex + 1} / {table.getPageCount()}
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.nextPage()}
						disabled={!table.getCanNextPage()}
					>
						次へ
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => table.setPageIndex(table.getPageCount() - 1)}
						disabled={!table.getCanNextPage()}
					>
						最後
					</Button>
				</div>
			</div>
		</div>
	)
}

// Helper function to create a select column
export function createSelectColumn<TData>(): ColumnDef<TData> {
	return {
		id: "select",
		header: ({ table }) => (
			<Checkbox
				checked={
					table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")
				}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label="すべて選択"
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label="行を選択"
			/>
		),
		enableSorting: false,
		enableHiding: false,
	}
}

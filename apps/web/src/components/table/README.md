# DataTable コンポーネント

TanStack Table と Shadcn UI を使用した汎用的なテーブルコンポーネントです。

## 特徴

- ✅ 型安全な TanStack Table v8 統合
- ✅ ページネーション機能（クライアント側 & サーバー側）
- ✅ 行選択機能（オプション）
- ✅ ローディング状態
- ✅ カスタマイズ可能なカラム定義
- ✅ Shadcn UI スタイリング
- ✅ 空データ & ローディング状態のカスタムレンダリング

## 基本的な使用方法

```tsx
import { DataTable } from "@/components/table/DataTable"
import { type ColumnDef } from "@tanstack/react-table"

interface User {
	id: number
	name: string
	email: string
}

const columns: ColumnDef<User>[] = [
	{
		accessorKey: "id",
		header: "ID",
	},
	{
		accessorKey: "name",
		header: "名前",
	},
	{
		accessorKey: "email",
		header: "メールアドレス",
	},
]

export function UserTable() {
	const data: User[] = [
		{ id: 1, name: "田中太郎", email: "tanaka@example.com" },
		{ id: 2, name: "佐藤花子", email: "sato@example.com" },
	]

	return <DataTable columns={columns} data={data} />
}
```

## 行選択機能

```tsx
import { DataTable, createSelectColumn } from "@/components/table/DataTable"
import { type ColumnDef } from "@tanstack/react-table"
import { useState } from "react"

const columns: ColumnDef<User>[] = [
	createSelectColumn<User>(),
	{
		accessorKey: "name",
		header: "名前",
	},
	// ... other columns
]

export function SelectableUserTable() {
	const [rowSelection, setRowSelection] = useState({})

	return (
		<DataTable
			columns={columns}
			data={data}
			enableRowSelection
			rowSelection={rowSelection}
			onRowSelectionChange={setRowSelection}
		/>
	)
}
```

## サーバー側ページネーション

```tsx
export function ServerPaginatedTable() {
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize: 10,
	})

	// サーバーからデータを取得
	const { data, pageCount, isLoading } = useQuery({
		queryKey: ["users", pagination],
		queryFn: () => fetchUsers(pagination),
	})

	return (
		<DataTable
			columns={columns}
			data={data ?? []}
			pageSize={pagination.pageSize}
			pageIndex={pagination.pageIndex}
			pageCount={pageCount}
			onPaginationChange={setPagination}
			manualPagination
			isLoading={isLoading}
		/>
	)
}
```

## カスタムセル

```tsx
const columns: ColumnDef<User>[] = [
	{
		accessorKey: "status",
		header: "ステータス",
		cell: ({ getValue }) => {
			const status = getValue() as string
			return (
				<Badge variant={status === "active" ? "success" : "secondary"}>
					{status}
				</Badge>
			)
		},
	},
	{
		id: "actions",
		header: "操作",
		cell: ({ row }) => (
			<div className="flex gap-2">
				<Button size="sm" onClick={() => handleEdit(row.original.id)}>
					編集
				</Button>
				<Button size="sm" variant="destructive" onClick={() => handleDelete(row.original.id)}>
					削除
				</Button>
			</div>
		),
	},
]
```

## カスタムローディング & 空データ表示

```tsx
<DataTable
	columns={columns}
	data={data}
	isLoading={isLoading}
	renderLoading={() => (
		<div className="flex items-center justify-center p-12">
			<Spinner size="lg" />
			<span className="ml-2">データを読み込んでいます...</span>
		</div>
	)}
	renderEmpty={() => (
		<div className="text-center p-12">
			<p className="text-muted-foreground">データが見つかりませんでした</p>
			<Button className="mt-4" onClick={handleCreate}>
				新規作成
			</Button>
		</div>
	)}
/>
```

## Props

### DataTableProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `ColumnDef<TData, TValue>[]` | **必須** | テーブルのカラム定義 |
| `data` | `TData[]` | **必須** | 表示するデータ |
| `pageSize` | `number` | `10` | 1ページあたりの行数 |
| `pageIndex` | `number` | `0` | 現在のページインデックス（0始まり） |
| `pageCount` | `number` | `undefined` | 総ページ数（`manualPagination`時に必要） |
| `onPaginationChange` | `(pagination: PaginationState) => void` | `undefined` | ページネーション変更時のコールバック |
| `manualPagination` | `boolean` | `false` | サーバー側ページネーションを有効化 |
| `enableRowSelection` | `boolean` | `false` | 行選択機能を有効化 |
| `rowSelection` | `RowSelectionState` | `{}` | 選択された行の状態 |
| `onRowSelectionChange` | `(selection: RowSelectionState) => void` | `undefined` | 行選択変更時のコールバック |
| `getRowId` | `(row: TData, index: number) => string` | `undefined` | 行のユニークID取得関数 |
| `isLoading` | `boolean` | `false` | ローディング状態 |
| `tableOptions` | `Partial<TableOptions<TData>>` | `undefined` | TanStack Table の追加オプション |
| `showPaginationInfo` | `boolean` | `true` | ページネーション情報の表示 |
| `paginationInfoTemplate` | `(params) => ReactNode` | `undefined` | カスタムページネーション情報テンプレート |
| `renderEmpty` | `() => ReactNode` | `undefined` | 空データ時のカスタムレンダリング |
| `renderLoading` | `() => ReactNode` | `undefined` | ローディング時のカスタムレンダリング |
| `className` | `string` | `undefined` | ルートコンテナのクラス名 |
| `tableClassName` | `string` | `undefined` | テーブル要素のクラス名 |
| `containerClassName` | `string` | `undefined` | テーブルコンテナのクラス名 |

## ヘルパー関数

### createSelectColumn<TData>()

行選択用のチェックボックスカラムを作成します。

```tsx
const columns: ColumnDef<User>[] = [
	createSelectColumn<User>(),
	// ... other columns
]
```

## 参考

- [TanStack Table Documentation](https://tanstack.com/table/latest)
- [Shadcn UI Table](https://ui.shadcn.com/docs/components/table)

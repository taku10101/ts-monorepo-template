# Next.js + Hono Monorepo

pnpm workspacesを使用したモノレポプロジェクト。Next.jsフロントエンドとHono APIバックエンドで構成されています。React Hook Form/Zodによるフォームハンドリングと、Prisma/PostgreSQLを使用したRESTful Todo APIのデモンストレーションを提供します。

## プロジェクト構成

```
template/
├── apps/
│   ├── web/              # Next.js 15 App Router アプリケーション
│   │   ├── src/
│   │   │   ├── app/      # Next.js App Router ページ
│   │   │   ├── components/
│   │   │   │   ├── form/  # 汎用フォームシステム (React Hook Form + Zod)
│   │   │   │   ├── table/ # 汎用テーブルシステム (TanStack Table + Shadcn UI)
│   │   │   │   └── ui/    # shadcn/ui コンポーネント
│   │   │   └── lib/       # ユーティリティ
│   │   ├── mock/         # モックサーバー (json-server)
│   │   │   ├── types/        # 型定義
│   │   │   ├── generators/   # データジェネレーター
│   │   │   └── data/         # 生成されたJSONデータ
│   │   └── package.json
│   └── api/              # Hono API サーバー (OpenAPI/Swagger対応)
│       ├── src/
│       │   ├── routes/        # OpenAPI ルート定義
│       │   ├── services/      # ビジネスロジック層
│       │   ├── repositories/  # データアクセス層
│       │   ├── lib/           # 共通ユーティリティ
│       │   └── generated/     # 自動生成ファイル (Prismaクライアント)
│       ├── prisma/
│       │   ├── schema.prisma  # データベーススキーマ
│       │   └── seed/          # シードデータ
│       └── package.json
├── packages/         # 共有パッケージ (将来使用予定)
├── biome.json        # Biome設定 (Linter/Formatter)
├── docker-compose.yml # PostgreSQL設定
└── pnpm-workspace.yaml
```

## 初期セットアップ

```bash
# 1. 依存関係のインストール (ルートから実行)
pnpm install

# 2. 環境変数の設定
cp apps/api/.env.example apps/api/.env

# 3. PostgreSQLデータベースの起動
docker compose up -d

# 4. データベースの初期化
cd apps/api
pnpm prisma:generate  # Prismaクライアント生成
pnpm prisma:migrate   # マイグレーション実行
pnpm prisma:seed      # サンプルデータ投入
```

## 開発

```bash
# すべてのアプリケーションを並列で起動
pnpm dev

# 個別に起動する場合
pnpm --filter @monorepo/web dev    # Next.js (http://localhost:3000)
pnpm --filter @monorepo/api dev    # Hono API (http://localhost:3001)
```

### モックサーバー (Web)

TypeScriptインターフェースから型安全なモックデータを生成し、json-serverで提供します。

```bash
# Webディレクトリに移動
cd apps/web

# モックデータ生成
pnpm mock:generate

# モックサーバー起動 (http://localhost:3002)
pnpm mock:server

# データ生成 + サーバー起動
pnpm mock:dev
```

詳細は [apps/web/mock/README.md](./apps/web/mock/README.md) を参照してください。

## データベース管理 (API)

```bash
# APIディレクトリに移動
cd apps/api

# Prismaクライアント生成 (スキーマ変更後)
pnpm prisma:generate

# マイグレーション作成・実行
pnpm prisma:migrate

# サンプルデータ投入
pnpm prisma:seed

# Prisma Studio起動 (ビジュアルデータベースエディタ)
pnpm prisma:studio
```

## コード品質

```bash
# 型チェック
pnpm typecheck                      # 全アプリを並列チェック

# Linting & Formatting (Biome使用)
pnpm biome:check                    # 問題をチェック
pnpm biome:check:write              # 自動修正
pnpm lint                           # Lintのみ
pnpm lint:fix                       # Lint & 修正
pnpm format                         # Formatチェックのみ
pnpm format:fix                     # Format & 修正

# CI モード (CI/CDパイプライン用)
pnpm ci                             # 全チェックをCIモードで実行
```

## ビルド

```bash
# すべてのアプリケーションをビルド
pnpm build

# 個別にビルドする場合
pnpm --filter @monorepo/web build
pnpm --filter @monorepo/api build
```

## Docker

```bash
# PostgreSQL起動
docker compose up -d

# PostgreSQL停止
docker compose down

# ログ表示
docker compose logs -f postgres
```

## アーキテクチャ

### API アーキテクチャ (apps/api)

レイヤードアーキテクチャパターンを採用:

```
routes/ → services/ → repositories/ → Prisma Client
```

- **routes/**: `@hono/zod-openapi`を使用したOpenAPIルート定義とZodスキーマバリデーション
- **services/**: ビジネスロジック層
- **repositories/**: データアクセス層 (Prisma操作を抽象化)
- **lib/**: 共通ユーティリティ (Prismaクライアントシングルトン等)
- **generated/prisma/**: 自動生成Prismaクライアント (手動編集禁止)

主な特徴:
- OpenAPIドキュメント: `http://localhost:3001/ui` (Swagger UI)
- OpenAPI仕様: `http://localhost:3001/doc`
- リポジトリパターンによるデータベース操作 (ルートから直接Prisma呼び出し禁止)

### Web アーキテクチャ (apps/web)

Next.js 15 App Routerとカスタムフォームシステム:

主な特徴:
- **汎用フォームシステム** (`components/form/`): React Hook Form + Zodベースの再利用可能なフォームアーキテクチャ
  - 型安全なコンテキスト
  - 事前構築されたフィールドコンポーネント
  - バリデーションユーティリティ (`formValidation.email()`, `password()`, etc.)
- **汎用テーブルシステム** (`components/table/`): TanStack Table + Shadcn UIベースの再利用可能なテーブルコンポーネント
  - 型安全なカラム定義
  - ページネーション（クライアント側・サーバー側）
  - 行選択機能
  - カスタマイズ可能なレンダリング
- TypeScriptジェネリクスによるZodスキーマからフォームフィールドへの完全な型推論
- shadcn/uiコンポーネント (Tailwind CSS v4 + class-variance-authority)

### データベース

- **ORM**: Prisma 7.x
- **Database**: PostgreSQL 16 (Docker Compose経由)
- **スキーマ**: `apps/api/prisma/schema.prisma`
- **クライアント出力先**: `apps/api/src/generated/prisma/` (カスタムロケーション)
- **シードデータ**: `apps/api/prisma/seed/` ディレクトリ

スキーマ変更後の手順:
1. `pnpm prisma:generate` でクライアント再生成
2. `pnpm prisma:migrate` でマイグレーション作成・適用

### 環境変数

APIには `apps/api/.env` が必要です:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/todo_dev"
NODE_ENV=development
PORT=3001
```

テンプレートとして `apps/api/.env.example` を使用してください。

## API エンドポイント

Hono APIサーバー (http://localhost:3001):

- `GET /` - Welcome メッセージ
- `GET /health` - ヘルスチェック
- Swagger UI: `http://localhost:3001/ui`
- OpenAPI仕様: `http://localhost:3001/doc`

詳細なエンドポイントはSwagger UIで確認できます。

## 技術スタック

### フロントエンド (apps/web)
- **Next.js**: 15 (App Router)
- **React**: 19
- **TypeScript**: 5.6.3
- **フォーム**: React Hook Form + Zod
- **UI**: shadcn/ui
- **スタイリング**: Tailwind CSS v4
- **ユーティリティ**: class-variance-authority, tailwind-merge

### バックエンド (apps/api)
- **Hono**: 軽量高速Webフレームワーク
- **Prisma**: 7.x (ORM)
- **PostgreSQL**: 16
- **OpenAPI**: @hono/zod-openapi
- **バリデーション**: Zod
- **開発**: tsx (hot-reloading)

### モックサーバー (apps/web/mock)
- **json-server**: RESTful APIモックサーバー
- **@faker-js/faker**: リアルなダミーデータ生成
- **TypeScript**: 型安全なデータ生成

### 開発ツール
- **パッケージマネージャー**: pnpm
- **Linter/Formatter**: Biome (ESLint + Prettier代替)
- **型チェック**: TypeScript 5.6.3
- **コンテナ**: Docker Compose

### コード品質
- Biome設定 (`biome.json`)
  - タブインデント、ダブルクォート、セミコロン自動
  - `useExhaustiveDependencies`, `noUnusedVariables` 有効
  - `apps/web/src/components/form/` では `noExplicitAny` 無効 (ジェネリックフォームシステムのため)

## よくあるパターン

### 新しいフォームの追加 (Web)

既存のフォームシステムを使用してください。`apps/web/src/components/form/example-form.tsx` を参考に:

```tsx
import { FormProvider, FormInputField, createFormSchema, formValidation } from "@/components/form"

const schema = createFormSchema({
  email: formValidation.email(),
  password: formValidation.password(8),
  username: formValidation.requiredString(2),
})

<FormProvider schema={schema} onSubmit={handleSubmit}>
  <FormInputField name="email" label="Email" type="email" />
  <FormInputField name="password" label="Password" type="password" />
  <FormInputField name="username" label="Username" />
</FormProvider>
```

### 新しいテーブルの追加 (Web)

既存のテーブルシステムを使用してください。詳細は [apps/web/src/components/table/README.md](./apps/web/src/components/table/README.md) を参照:

```tsx
import { DataTable, createSelectColumn } from "@/components/table/DataTable"
import type { ColumnDef } from "@tanstack/react-table"

const columns: ColumnDef<User>[] = [
  createSelectColumn<User>(),  // 行選択を有効化
  { accessorKey: "name", header: "名前" },
  { accessorKey: "email", header: "メール" },
]

<DataTable
  columns={columns}
  data={users}
  pageSize={10}
  enableRowSelection
  manualPagination
  isLoading={isLoading}
/>
```

### 新しいAPIエンドポイントの追加

1. `apps/api/src/routes/` でルートを定義 (`@hono/zod-openapi`の`createRoute`使用)
2. リクエスト/レスポンスバリデーション用のZodスキーマ作成
3. `apps/api/src/services/` でサービス実装
4. `apps/api/src/repositories/` でリポジトリ実装 (DB アクセスが必要な場合)
5. `apps/api/src/index.ts` でルート登録

### Prismaでの作業

- 常にリポジトリパターンを使用 (ルートから直接Prisma呼び出し禁止)
- 生成クライアントからインポート: `import { PrismaClient } from '@/generated/prisma'`
- `apps/api/src/lib/prisma.ts` のシングルトンパターンを使用

## 詳細情報

- より詳しいガイダンス: [CLAUDE.md](./CLAUDE.md)
- テーブルコンポーネントの使い方: [apps/web/src/components/table/README.md](./apps/web/src/components/table/README.md)
- モックサーバーの使い方: [apps/web/mock/README.md](./apps/web/mock/README.md)
- モックサーバー詳細ガイド: [apps/web/mock/USAGE.md](./apps/web/mock/USAGE.md)

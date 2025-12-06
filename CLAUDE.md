# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリのコードを扱う際のガイダンスを提供します。

## 概要

pnpm workspaceベースのモノレポで、Next.jsフロントエンドとHono APIバックエンドで構成されています。フロントエンドではReact Hook Form/Zodによるフォームハンドリング、バックエンドではPrisma/PostgreSQLを使用したRESTful Todo APIのデモンストレーションを提供します。

## コマンド

### 初期セットアップ
```bash
# 依存関係のインストール (ルートから実行)
pnpm install

# 環境変数の設定
cp apps/api/.env.example apps/api/.env

# PostgreSQLデータベースの起動
docker compose up -d

# データベースの初期化 (Prismaクライアント生成、マイグレーション実行、シードデータ投入)
cd apps/api
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
```

### 開発
```bash
# すべてのアプリを並列で起動
pnpm dev

# 個別に起動する場合
pnpm --filter @monorepo/web dev    # Next.js (http://localhost:3000)
pnpm --filter @monorepo/api dev    # Hono API (http://localhost:3001)
```

### データベース (APIのみ)
```bash
# 最初にAPIディレクトリに移動
cd apps/api

# Prismaクライアントの生成 (スキーマ変更後)
pnpm prisma:generate

# マイグレーションの作成と実行
pnpm prisma:migrate

# サンプルデータの投入
pnpm prisma:seed

# Prisma Studioを開く (ビジュアルデータベースエディタ)
pnpm prisma:studio
```

### コード品質
```bash
# 型チェック
pnpm typecheck                      # 全アプリを並列でチェック

# Linting と Formatting (Biome使用)
pnpm biome:check                    # 問題をチェック
pnpm biome:check:write              # 自動で問題を修正
pnpm lint                           # Lintのみ
pnpm lint:fix                       # Lint & 修正
pnpm format                         # Formatチェックのみ
pnpm format:fix                     # Format & 修正

# CIモード (CI/CDパイプライン用)
pnpm ci                             # すべてのチェックをCIモードで実行
```

### ビルド
```bash
# すべてのアプリをビルド
pnpm build

# 個別にビルドする場合
pnpm --filter @monorepo/web build
pnpm --filter @monorepo/api build
```

### Docker
```bash
# PostgreSQLの起動
docker compose up -d

# PostgreSQLの停止
docker compose down

# ログの表示
docker compose logs -f postgres
```

## アーキテクチャ

### モノレポ構成
- **apps/web**: Next.js 15 App Router アプリケーション
- **apps/api**: OpenAPI/Swagger対応のHono APIサーバー
- **packages/**: 共有パッケージ (現在は空、将来の使用のために予約)

### API アーキテクチャ (apps/api)

APIはレイヤードアーキテクチャパターンに従っています:

```
routes/ → services/ → repositories/ → Prisma Client
```

- **routes/**: リクエスト/レスポンスバリデーション用のZodスキーマを持つOpenAPIルート定義
- **services/**: ビジネスロジック層
- **repositories/**: データアクセス層 (Prisma操作を抽象化)
- **lib/**: 共有ユーティリティ (Prismaクライアントシングルトン)
- **generated/prisma/**: 自動生成されたPrismaクライアント (手動で編集しないこと)

主要なパターン:
- すべてのルートは型安全なルーティングと自動OpenAPIドキュメント生成のために `@hono/zod-openapi` を使用
- Prismaクライアントは `src/generated/prisma/` に生成される (デフォルトの場所ではない)
- OpenAPIドキュメントは `http://localhost:3001/ui` で利用可能 (Swagger UI)
- OpenAPI仕様は `http://localhost:3001/doc` で利用可能
- データベース操作にはリポジトリパターンを使用 (ルートから直接Prismaを呼び出さない)

### Web アーキテクチャ (apps/web)

Next.js 15のApp Routerとカスタムフォームシステム:

```
src/
├── app/              # Next.js App Router ページ
├── components/
│   ├── form/        # 汎用フォームプロバイダーシステム
│   └── ui/          # shadcn/ui コンポーネント
└── lib/             # ユーティリティ (Tailwind用のcnヘルパー)
```

主要なパターン:
- **汎用フォームシステム** (`components/form/`): React Hook Form + Zodをベースにした再利用可能なフォームアーキテクチャ
  - `form-provider.tsx`: 型安全なコンテキストを持つコアFormProviderコンポーネント
  - `form-fields.tsx`: 事前構築されたフィールドコンポーネント (FormInputField, FormCustomField)
  - `form-utils.ts`: バリデーションユーティリティ (formValidation.email(), password(), など)
  - `form.tsx`: shadcn/ui フォームコンポーネント (Form, FormField, FormItem, など)
  - `example-form.tsx`, `login-form-example.tsx`, `user-form-example.tsx`: リファレンス実装
- Zodスキーマからフォームフィールドへの完全な型推論のためにTypeScriptジェネリクスを使用
- `components/ui/` のshadcn/uiコンポーネント (Tailwind CSS v4 + class-variance-authority)

### データベース

- **ORM**: Prisma 7.x (TypeScript-based query compiler、Rust-free)
- **Database**: PostgreSQL 16 (Docker Compose経由)
- **Driver Adapter**: `@prisma/adapter-pg` (Prisma 7では必須)
- **スキーマの場所**: `apps/api/prisma/schema.prisma`
- **クライアント出力先**: `apps/api/src/generated/prisma/` (カスタムロケーション、デフォルトではない)
- **設定ファイル**: `apps/api/prisma.config.ts` (マイグレーション用のDB接続設定)
- **シードデータ**: `apps/api/prisma/seed/` ディレクトリ

Prisma 7の重要な変更点:
- schema.prismaの`datasource`ブロックには`url`プロパティを含めない (Prisma 7では非推奨)
- データベース接続URLは`prisma.config.ts`で管理
- PrismaClientの初期化時にdriver adapterを渡す必要がある
- `engineType = "client"`を使用 (TypeScriptベースのクエリコンパイラ)

スキーマ変更後:
1. `pnpm prisma:generate` を実行してクライアントを再生成
2. `pnpm prisma:migrate` を実行してマイグレーションを作成・適用

PrismaClient初期化の例:
```typescript
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@/generated/prisma/client"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({ adapter })
```

### 環境変数

APIには `apps/api/.env` に環境変数が必要です:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/todo_dev"
NODE_ENV=development
PORT=3001
```

テンプレートとして `apps/api/.env.example` を使用してください。Docker Composeのデフォルト認証情報はサンプルファイルと一致します。

### スタイリング

- `@tailwindcss/postcss` を使用したTailwind CSS v4
- `apps/web/src/components/ui/` のshadcn/uiコンポーネント (CLI経由ではなく手動管理)
- コンポーネントのバリアント用に `class-variance-authority`
- `cn()` ユーティリティ経由でのclassName結合のために `tailwind-merge`

### コード品質ツール

- **Linter/Formatter**: Biome (ESLint + Prettierの代替)
  - 設定: ルートの `biome.json`
  - フォーマット: インデントにタブ、ダブルクォート、必要に応じてセミコロン
  - 主要なルール: `useExhaustiveDependencies`, `noUnusedVariables`, `useNodejsImportProtocol`
  - 特別なオーバーライド: `apps/web/src/components/form/` では `noExplicitAny` を無効化 (汎用フォームシステムのため)
- **型チェック**: TypeScript 5.6.3
  - 各アプリには独自の `tsconfig.json` がある
  - ルートから `pnpm typecheck` を実行してすべてのアプリをチェック

## よくあるパターン

### 新しいフォームの追加 (Web)

新しいフォーム実装を作成するのではなく、既存のフォームシステムを使用してください。`apps/web/src/components/form/example-form.tsx` を参考にしてください:

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

`form-utils.ts` で利用可能なバリデーションヘルパー:
- `formValidation.email()` - メールバリデーション
- `formValidation.password(minLength)` - 最小文字数付きパスワード
- `formValidation.requiredString(minLength)` - 最小文字数付き必須文字列
- `formValidation.optionalString()` - オプショナル文字列
- カスタムバリデーターは `form-utils.ts` に追加可能

### 新しいAPIエンドポイントの追加

1. `@hono/zod-openapi` の `createRoute` を使用して `apps/api/src/routes/` でルートを定義
2. リクエスト/レスポンスバリデーション用のZodスキーマを作成
3. `apps/api/src/services/` でサービスを実装
4. `apps/api/src/repositories/` でリポジトリを実装 (データベースアクセスが必要な場合)
5. `apps/api/src/index.ts` でルートを登録

### Prismaでの作業

- 常にリポジトリパターンを使用 (ルートから直接Prismaを呼び出さない)
- 生成されたクライアントからインポート: `import { PrismaClient } from '@/generated/prisma/client'`
- 型のインポート: `import type { Todo, Prisma } from '@/generated/prisma/client'`
- `apps/api/src/lib/prisma.ts` のシングルトンパターンを使用 (adapterの初期化を含む)
- Prisma 7ではdriver adapterが必須 (`@prisma/adapter-pg`を使用)

## TypeScript設定

- ルートには基本の `typescript` dev dependencyがある
- 各アプリには独自の `tsconfig.json` がある
- APIは開発時のホットリロードに `tsx` を使用
- WebはNext.js組み込みのTypeScriptサポートを使用

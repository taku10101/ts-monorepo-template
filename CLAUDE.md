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
cp .env.example .env
# .envファイルを編集して、必要に応じて環境変数を調整

# PostgreSQLとMinIOの起動
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

### モックサーバー (Webのみ)
```bash
# Webディレクトリに移動
cd apps/web

# モックデータを生成
pnpm mock:generate

# モックサーバーを起動 (http://localhost:3002)
pnpm mock:server

# データ生成 + サーバー起動
pnpm mock:dev
```

詳細は `apps/web/mock/README.md` と `apps/web/mock/USAGE.md` を参照してください。

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

### テスト (APIのみ)
```bash
# APIディレクトリに移動
cd apps/api

# 画像API統合テストの実行
pnpm exec tsx src/tests/image.test.ts

# 前提条件:
# 1. MinIOが起動していること (docker compose up -d minio)
# 2. APIサーバーが起動していること (pnpm dev)
# 3. 環境変数が設定されていること (.env ファイル)
```

詳細は `apps/api/src/tests/README.md` を参照してください。

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
# PostgreSQLとMinIOの起動 (開発環境)
docker compose up -d

# 本番環境用の設定で起動
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# サービスの停止
docker compose down

# ログの表示
docker compose logs -f postgres
docker compose logs -f minio
```

### MinIO / オブジェクトストレージ
```bash
# MinIO Web UI へのアクセス (開発環境)
# URL: http://localhost:9001
# Username: minioadmin (MINIO_ROOT_USER)
# Password: minioadmin (MINIO_ROOT_PASSWORD)

# MinIO ヘルスチェック
curl http://localhost:9000/minio/health/live

# MinIO API エンドポイント (開発環境)
# API: http://localhost:9000
```

#### ストレージバックエンドの選択

環境変数 `STORAGE_BACKEND` でストレージバックエンドを選択できます:

- **`minio`** (デフォルト): 開発環境向け。アクセスキー/シークレットキー認証を使用
- **`s3`**: 本番環境向け。AWS S3とIAMロール認証をサポート

**開発環境の設定例** (`.env`):
```bash
STORAGE_BACKEND=minio
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
MINIO_REGION=us-east-1
MINIO_MAX_FILE_SIZE=10485760  # 10MB
```

**本番環境の設定例** (IAMロール使用):
```bash
STORAGE_BACKEND=s3
AWS_REGION=us-east-1
# IAMロール使用時は認証情報不要
# AWS_ACCESS_KEY_ID と AWS_SECRET_ACCESS_KEY は自動的に取得される
```

**本番環境の設定例** (明示的な認証情報):
```bash
STORAGE_BACKEND=s3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
# または外部MinIO/S3互換サービスを使用
MINIO_ENDPOINT=s3.example.com
MINIO_PORT=443
MINIO_USE_SSL=true
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
  - `todo.routes.ts`: Todo CRUD エンドポイント
  - `image.routes.ts`: 画像アップロード/取得/削除エンドポイント
- **schemas/**: Zodスキーマ定義
  - `common.schema.ts`: 共通スキーマ (エラーレスポンスなど)
  - `image.schema.ts`: 画像関連のリクエスト/レスポンススキーマ
- **services/**: ビジネスロジック層
  - `storage.service.ts`: MinIOストレージサービス (開発環境向け)
  - `s3-storage.service.ts`: AWS S3ストレージサービス (本番環境向け、IAMロール対応)
  - `todo.service.ts`: Todoビジネスロジック
- **repositories/**: データアクセス層 (Prisma操作を抽象化)
- **lib/**: 共有ユーティリティ
  - `prisma.ts`: Prismaクライアントシングルトン
  - `minio.ts`: MinIOクライアント設定（環境別認証対応）
- **tests/**: テストファイル
  - `image.test.ts`: 画像API統合テスト
  - `README.md`: テスト実行方法のドキュメント
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

### ストレージサービスでの作業

ファイルアップロード/ダウンロードが必要な場合は、ストレージサービスを使用してください。

#### 基本的な使用方法

```typescript
import { createStorageService } from '@/services/s3-storage.service'

// ストレージサービスのインスタンスを取得
// 環境変数 STORAGE_BACKEND に基づいて自動的にMinIOまたはS3を選択
const storageService = createStorageService()

// ファイルのアップロード
const objectName = await storageService.uploadFile(
  'my-bucket',
  'path/to/file.jpg',
  fileBuffer,
  'image/jpeg'
)

// ファイルのダウンロード
const buffer = await storageService.downloadFile('my-bucket', 'path/to/file.jpg')

// ファイルの削除
await storageService.deleteFile('my-bucket', 'path/to/file.jpg')

// プレサインドURLの生成 (1時間有効)
const url = await storageService.getPresignedUrl('my-bucket', 'path/to/file.jpg', 3600)

// バケットの確認・作成
await storageService.ensureBucket('my-bucket')

// ヘルスチェック
const isHealthy = await storageService.healthCheck()
```

#### 開発環境と本番環境の切り替え

- 開発環境: `STORAGE_BACKEND=minio` (デフォルト)
  - MinIOコンテナを使用
  - アクセスキー/シークレットキー認証

- 本番環境: `STORAGE_BACKEND=s3`
  - AWS S3または外部S3互換サービスを使用
  - IAMロール認証（推奨）または明示的な認証情報

### 画像アップロード機能の使用

画像APIエンドポイントは `apps/api/src/routes/image.routes.ts` に実装されています。

#### 利用可能なエンドポイント

1. **画像のアップロード**: `POST /api/images`
   - Content-Type: `multipart/form-data`
   - パラメータ:
     - `file`: 画像ファイル (必須)
     - `path`: カスタムパス (オプション、例: "user123/profile.jpg")
   - 許可されるファイルタイプ: JPEG, PNG, GIF, WebP
   - 最大ファイルサイズ: 10MB (デフォルト)

2. **画像の取得**: `GET /api/images/{path}`
   - パスパラメータ: URLエンコードされた画像パス
   - レスポンス: 画像バイナリデータ

3. **画像の削除**: `DELETE /api/images/{path}`
   - パスパラメータ: URLエンコードされた画像パス

#### クライアント側での使用例

```typescript
// 画像のアップロード
const formData = new FormData()
formData.append('file', imageFile)
formData.append('path', 'user123/profile.jpg') // オプション

const response = await fetch('http://localhost:3001/api/images', {
  method: 'POST',
  body: formData,
})

const data = await response.json()
// { objectName, url, contentType, size }

// 画像の取得
const imagePath = encodeURIComponent('user123/profile.jpg')
const imageResponse = await fetch(`http://localhost:3001/api/images/${imagePath}`)
const imageBlob = await imageResponse.blob()

// 画像の削除
await fetch(`http://localhost:3001/api/images/${imagePath}`, {
  method: 'DELETE',
})
```

#### テストの実行

画像APIの統合テストを実行するには:

```bash
cd apps/api
pnpm exec tsx src/tests/image.test.ts
```

詳細は `apps/api/src/tests/README.md` を参照してください。

## TypeScript設定

- ルートには基本の `typescript` dev dependencyがある
- 各アプリには独自の `tsconfig.json` がある
- APIは開発時のホットリロードに `tsx` を使用
- WebはNext.js組み込みのTypeScriptサポートを使用

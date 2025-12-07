# Mock Server (json-server)

TypeScriptインターフェースから型安全なモックデータを生成し、json-serverで提供します。

## ディレクトリ構造

```
mock/
├── types/           # 型定義
│   └── base.ts      # 基本的な型定義
├── generators/      # データジェネレーター
│   ├── base-generator.ts      # 基本的なジェネレーター関数
│   └── example-generators.ts  # サンプルのジェネレーター
├── data/           # 生成されたJSONデータ
│   └── db.json     # json-server用のデータベースファイル
├── generate-db.ts  # データ生成スクリプト
└── README.md       # このファイル
```

## 使い方

### 1. 新しいインターフェースを定義

`generators/example-generators.ts`（または新しいファイル）でインターフェースとジェネレーターを定義：

```typescript
import { faker } from "@faker-js/faker"
import type { MockGenerator } from "../types/base"

// インターフェースを定義
export interface Product {
  id: number
  name: string
  price: number
  description: string
  inStock: boolean
}

// ジェネレーター関数を作成（IDは自動生成されるのでOmit）
export const generateProduct: MockGenerator<Omit<Product, "id">> = () => ({
  name: faker.commerce.productName(),
  price: Number.parseFloat(faker.commerce.price()),
  description: faker.commerce.productDescription(),
  inStock: faker.datatype.boolean(),
})
```

### 2. generate-db.tsに追加

```typescript
import { generateProduct } from "./generators/example-generators"

function generateDatabase(): DatabaseSchema {
  return {
    users: generateMockDataWithIds(generateUser, { count: 10 }),
    products: generateMockDataWithIds(generateProduct, { count: 50 }), // 追加
  }
}
```

### 3. モックデータを生成

```bash
pnpm mock:generate
```

`data/db.json`に型安全なモックデータが生成されます。

### 4. モックサーバーを起動

```bash
pnpm mock:server
```

サーバーが`http://localhost:3001`で起動します。

## APIエンドポイント

json-serverは以下のRESTful APIを自動生成します：

```
GET    /users          # すべてのユーザーを取得
GET    /users/1        # ID=1のユーザーを取得
POST   /users          # 新しいユーザーを作成
PUT    /users/1        # ID=1のユーザーを更新
PATCH  /users/1        # ID=1のユーザーを部分更新
DELETE /users/1        # ID=1のユーザーを削除

# クエリパラメータ
GET /users?name=John               # 名前でフィルター
GET /users?_sort=name&_order=asc   # ソート
GET /users?_page=1&_limit=10       # ページネーション
```

詳細は[json-server documentation](https://github.com/typicode/json-server)を参照してください。

## コマンド

```bash
# モックデータを生成
pnpm mock:generate

# モックサーバーを起動
pnpm mock:server

# データ生成 + サーバー起動
pnpm mock:dev
```

## 利点

1. **型安全性**: TypeScriptインターフェースから型を定義
2. **再現性**: faker.jsでリアルなデータを生成
3. **柔軟性**: 簡単にカスタマイズ可能
4. **開発速度**: バックエンドなしでフロントエンド開発が可能

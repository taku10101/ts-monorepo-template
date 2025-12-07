# Mock Server 使用ガイド

## クイックスタート

```bash
# 1. モックデータを生成
pnpm mock:generate

# 2. モックサーバーを起動
pnpm mock:server

# または、1と2を同時に実行
pnpm mock:dev
```

モックサーバーは `http://localhost:3002` で起動します。

## 新しいデータ型を追加する

### ステップ1: インターフェースを定義

`mock/generators/your-generators.ts` を作成：

```typescript
import { faker } from "@faker-js/faker"
import type { MockGenerator } from "../types/base"

// インターフェースを定義
export interface Product {
  id: number
  name: string
  price: number
  category: string
  inStock: boolean
}

// ジェネレーター関数を作成
export const generateProduct: MockGenerator<Omit<Product, "id">> = () => ({
  name: faker.commerce.productName(),
  price: Number.parseFloat(faker.commerce.price()),
  category: faker.commerce.department(),
  inStock: faker.datatype.boolean(),
})
```

### ステップ2: generate-db.tsに追加

```typescript
import { generateProduct } from "./generators/your-generators"

function generateDatabase(): DatabaseSchema {
  return {
    users: generateMockDataWithIds(generateUser, { count: 10 }),
    posts: generateMockDataWithIds(generatePost, { count: 20 }),
    comments: generateMockDataWithIds(generateComment, { count: 50 }),
    products: generateMockDataWithIds(generateProduct, { count: 30 }), // 追加
  }
}
```

### ステップ3: 型をエクスポート

`mock/types/index.ts` に追加：

```typescript
export type { Product } from "../generators/your-generators"
```

### ステップ4: データを生成

```bash
pnpm mock:generate
```

## フロントエンドでの使用

### 型安全なAPIクライアント

```typescript
"use client"

import { useEffect, useState } from "react"
import type { Product } from "@/mock/types"
import { get, post, patch, del } from "@/lib/mock-api"

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    // すべての商品を取得
    get<Product[]>("/products").then(setProducts)

    // フィルタリング
    get<Product[]>("/products", { category: "Electronics" })

    // ソート
    get<Product[]>("/products", {
      _sort: "price",
      _order: "desc"
    })

    // ページネーション
    get<Product[]>("/products", {
      _page: "1",
      _limit: "10"
    })
  }, [])

  async function addProduct(data: Omit<Product, "id">) {
    const newProduct = await post<Product>("/products", data)
    setProducts([...products, newProduct])
  }

  async function updateProduct(id: number, updates: Partial<Product>) {
    await patch<Product>("/products/" + id, updates)
    // 再フェッチ...
  }

  async function deleteProduct(id: number) {
    await del("/products/" + id)
    setProducts(products.filter(p => p.id !== id))
  }

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  )
}
```

### Server Componentsで使用

```typescript
import type { Product } from "@/mock/types"

async function getProducts(): Promise<Product[]> {
  const res = await fetch("http://localhost:3002/products")
  return res.json()
}

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  )
}
```

## json-server の機能

### クエリパラメータ

```bash
# フィルタリング
GET /users?name=John
GET /products?category=Electronics&inStock=true

# ソート
GET /users?_sort=name&_order=asc
GET /products?_sort=price&_order=desc

# ページネーション
GET /users?_page=1&_limit=10

# 範囲
GET /products?price_gte=100&price_lte=500

# 検索
GET /users?q=john

# リレーション（埋め込み）
GET /posts?_embed=comments
GET /comments?_expand=post
```

### HTTPメソッド

```bash
GET    /users      # すべてのユーザー
GET    /users/1    # 特定のユーザー
POST   /users      # 新規作成
PUT    /users/1    # 完全更新
PATCH  /users/1    # 部分更新
DELETE /users/1    # 削除
```

## ヒント

### Faker.jsの活用

利用可能なFaker.jsメソッド：

```typescript
faker.person.fullName()          // "John Doe"
faker.internet.email()           // "john@example.com"
faker.lorem.paragraph()          // 段落テキスト
faker.commerce.productName()     // "商品名"
faker.commerce.price()           // "99.99"
faker.image.url()                // 画像URL
faker.date.past()                // 過去の日付
faker.datatype.boolean()         // true/false
faker.number.int({ min: 1, max: 100 })  // 1-100の整数
```

[Faker.js ドキュメント](https://fakerjs.dev/)で全メソッドを確認できます。

### カスタムロジック

より複雑なジェネレーター：

```typescript
export const generateOrder: MockGenerator<Omit<Order, "id">> = () => {
  const items = Array.from(
    { length: faker.number.int({ min: 1, max: 5 }) },
    () => ({
      productId: faker.number.int({ min: 1, max: 100 }),
      quantity: faker.number.int({ min: 1, max: 10 }),
    })
  )

  const total = items.reduce((sum, item) => sum + item.quantity * 100, 0)

  return {
    userId: faker.number.int({ min: 1, max: 50 }),
    items,
    total,
    status: faker.helpers.arrayElement(["pending", "shipped", "delivered"]),
    createdAt: faker.date.recent().toISOString(),
  }
}
```

## トラブルシューティング

### ポートが使用中の場合

`package.json` でポートを変更：

```json
"mock:server": "json-server mock/data/db.json --port 3003"
```

### CORSエラー

json-serverはデフォルトでCORSを許可しています。問題がある場合は、Next.jsの設定を確認してください。

### データのリセット

```bash
pnpm mock:generate
```

を実行すると、新しいランダムデータが生成されます。

# Image API Tests

このディレクトリには、画像アップロード・取得・削除APIの統合テストが含まれています。

## 前提条件

1. **MinIOの起動**
   ```bash
   # ルートディレクトリから実行
   docker compose up -d minio
   ```

2. **APIサーバーの起動**
   ```bash
   # apps/apiディレクトリで実行
   cd apps/api

   # 環境変数を設定してAPIサーバーを起動
   MINIO_ENDPOINT=localhost \
   MINIO_PORT=9000 \
   MINIO_ACCESS_KEY=minioadmin \
   MINIO_SECRET_KEY=minioadmin \
   MINIO_USE_SSL=false \
   MINIO_REGION=us-east-1 \
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/todo_dev" \
   pnpm dev
   ```

   **または、.envファイルを作成:**
   ```bash
   # apps/api/.env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/todo_dev"
   NODE_ENV=development
   PORT=3001
   STORAGE_BACKEND=minio
   MINIO_ENDPOINT=localhost
   MINIO_PORT=9000
   MINIO_ACCESS_KEY=minioadmin
   MINIO_SECRET_KEY=minioadmin
   MINIO_USE_SSL=false
   MINIO_REGION=us-east-1
   MINIO_MAX_FILE_SIZE=10485760
   ```

   その後、通常通り起動:
   ```bash
   pnpm dev
   ```

## テストの実行

```bash
cd apps/api

# 環境変数を設定してテストを実行
MINIO_ENDPOINT=localhost \
MINIO_PORT=9000 \
MINIO_ACCESS_KEY=minioadmin \
MINIO_SECRET_KEY=minioadmin \
MINIO_USE_SSL=false \
MINIO_REGION=us-east-1 \
pnpm exec tsx src/tests/image.test.ts
```

**または、.envファイルがある場合:**
```bash
pnpm exec tsx src/tests/image.test.ts
```

## テスト内容

### 成功ケース
1. **画像のアップロード** - PNG画像をアップロードし、URLとメタデータを取得
2. **画像の取得** - アップロードした画像をダウンロード
3. **画像の削除** - アップロードした画像を削除

### エラーケース
4. **存在しない画像の取得** - 404エラーが返されることを確認
5. **無効なファイルタイプのアップロード** - 400エラーが返されることを確認
6. **ファイルなしでアップロード** - 400エラーが返されることを確認

## API仕様

### アップロード
- **エンドポイント:** `POST /api/images`
- **Content-Type:** `multipart/form-data`
- **パラメータ:**
  - `file`: 画像ファイル (必須)
  - `path`: カスタムパス (オプション)
- **レスポンス:**
  ```json
  {
    "objectName": "test/1234567890-test.png",
    "url": "http://localhost:9000/images/...",
    "contentType": "image/png",
    "size": 70
  }
  ```

### 取得
- **エンドポイント:** `GET /api/images/{path}`
- **パス:** URLエンコードされた画像パス
- **レスポンス:** 画像バイナリデータ

### 削除
- **エンドポイント:** `DELETE /api/images/{path}`
- **パス:** URLエンコードされた画像パス
- **レスポンス:**
  ```json
  {
    "message": "Image deleted successfully",
    "objectName": "test/1234567890-test.png"
  }
  ```

## 重要な注意事項

- パスに`/`が含まれる場合、URLエンコードが必要です
  - 例: `test/image.png` → `test%2Fimage.png`
- 許可されているファイルタイプ: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- 最大ファイルサイズ: 10MB (デフォルト)

## OpenAPI ドキュメント

APIサーバーを起動後、以下のURLでSwagger UIにアクセスできます:
```
http://localhost:3001/ui
```

OpenAPI仕様は以下のURLで取得できます:
```
http://localhost:3001/doc
```

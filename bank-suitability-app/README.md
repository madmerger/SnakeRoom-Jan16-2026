# Mizuho Biz - 適合性スコアリングアプリケーション

銀行員が営業先で顧客にサービスを提案する際の適合性スコアを計算するWebアプリケーション（Phase 1 MVP）。

## テックスタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js 14 (App Router, TypeScript), shadcn/ui, Tailwind CSS |
| バックエンド | Python (FastAPI), SQLAlchemy |
| データベース | PostgreSQL 15 |
| 認証 | JWT (python-jose + passlib/bcrypt) |
| コンテナ | Docker Compose |

## セットアップ

### 前提条件
- Docker & Docker Compose がインストールされていること

### 起動方法

```bash
cd bank-suitability-app
docker-compose up --build
```

起動後:
- **フロントエンド**: http://localhost:3000
- **バックエンド API**: http://localhost:8000
- **API ドキュメント (Swagger)**: http://localhost:8000/docs

### デモアカウント

| ロール | メール | パスワード |
|--------|--------|-----------|
| 管理者 | admin@example.com | admin123 |
| 営業員 | tanaka@example.com | tanaka123 |

## API 仕様

### 認証
| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/auth/login` | ログイン（JWT発行） |
| POST | `/auth/register` | ユーザー登録 |

### 顧客管理
| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/customers` | 顧客一覧 |
| POST | `/customers` | 顧客登録 |
| GET | `/customers/{id}` | 顧客詳細 |
| PUT | `/customers/{id}` | 顧客更新 |

### 商品管理
| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/products` | 商品一覧 |
| POST | `/products` | 商品登録（管理者のみ） |
| GET | `/products/{id}` | 商品詳細 |

### 適合性スコアリング
| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/suitability/calculate` | 個別スコア算出 |
| GET | `/suitability/recommend/{customer_id}` | レコメンドリスト取得 |

## スコアリングロジック

スコアは 100点を基準に以下のルールで減点方式で算出されます:

### 1. リスク許容度 vs 商品リスクレベル
顧客のリスク許容度（conservative=1, moderate=3, aggressive=5）と商品リスクレベル（1-5）の乖離に応じて **乖離×15点** を減点。

### 2. 投資経験
- リスクレベル4以上の商品に対して投資経験3年未満: **(3-経験年数)×10点** 減点
- リスクレベル3以上の商品に対して投資経験0年: **10点** 減点

### 3. 投資額比率
- 最低投資額が総資産の50%超: **50点** 減点
- 最低投資額が総資産の30%超: **20点** 減点

### 4. 年齢考慮
- 70歳以上 × リスクレベル4以上: **20点** 減点
- 70歳以上 × リスクレベル3以上: **10点** 減点

### 判定基準
- スコア **60点以上**: 適合（`is_suitable = true`）
- スコア **60点未満**: 不適合（`is_suitable = false`）

## 初期データ（シード商品）

| 商品名 | カテゴリ | リスクレベル |
|--------|---------|-------------|
| 定期預金 | 預金 | 1 |
| 国債ファンド | 投資信託 | 2 |
| バランス型投資信託 | 投資信託 | 3 |
| 株式型投資信託 | 投資信託 | 4 |
| 外国株式ファンド | 投資信託 | 5 |
| 終身保険 | 保険 | 2 |
| 住宅ローン | ローン | 1 |

## テスト

バックエンドのスコアリングエンジンのユニットテスト:

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

## ディレクトリ構成

```
bank-suitability-app/
├── frontend/                # Next.js アプリ
│   ├── src/
│   │   ├── app/            # App Router ページ
│   │   ├── components/     # UIコンポーネント
│   │   └── lib/            # API クライアント・ユーティリティ
│   └── Dockerfile
├── backend/                 # FastAPI アプリ
│   ├── app/
│   │   ├── routers/        # APIルーター
│   │   ├── schemas/        # Pydantic スキーマ
│   │   ├── services/       # ビジネスロジック（スコアリング等）
│   │   ├── models.py       # SQLAlchemy モデル
│   │   ├── database.py     # DB接続設定
│   │   ├── config.py       # 環境設定
│   │   ├── main.py         # FastAPI エントリーポイント
│   │   └── seed.py         # シードデータ投入
│   ├── tests/              # pytest テスト
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

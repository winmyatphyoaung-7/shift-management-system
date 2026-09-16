# Shift Management System

コンビニエンスストアの紙ベースのシフト管理をデジタル化するための、個人開発中のフルスタックWebアプリケーションです。

スタッフが公開済みシフトを店舗外から安全に確認でき、マネージャーがシフト作成・公開・変更・欠員対応を一元管理できるシステムを目指しています。

> **Status:** Work in Progress（開発中）
> 現在はバックエンドの認証・認可およびスタッフ管理APIまで実装済みです。フロントエンド画面とシフト管理機能は開発中です。

## 背景と解決したい課題

勤務先では、シフト表を紙で管理しているため、スタッフは店舗に行かなければ予定を確認できません。また、欠勤時の代替スタッフ探しをLINEで行うため、多くのやり取りが発生します。

本プロジェクトでは、次の課題解決を目指しています。

- 公開済みシフトをいつでも確認できるようにする
- マネージャーによるシフト作成・公開・編集を効率化する
- 欠員募集、立候補、候補者選定をアプリ内で管理する
- シフト変更や代替依頼を通知できるようにする

## 現在実装済みの機能

### バックエンド基盤

- Express + TypeScriptによるREST API
- PostgreSQL + Prisma ORMによるデータ永続化
- Prisma migration、Client生成、冪等なseed処理
- Zodによるリクエスト検証
- 共通エラーハンドリング、404処理、不正JSON処理
- CORS設定とヘルスチェックAPI

### 認証・認可

- 3桁の店舗内ログインIDとパスワードによるログイン
- bcryptによるパスワードハッシュ化
- JWTをHttpOnly Cookieに保存
- ログイン試行へのRate Limit
- ログアウトと現在ログイン中のメンバー取得
- 初回ログイン時のパスワード変更
- `requireAuth`、`requirePasswordChanged`、`requireManager` middleware
- 非アクティブメンバーのログイン拒否

### スタッフ管理

- 店舗メンバー一覧取得
- Staffアカウント作成
- 氏名・ログインID・表示色の編集
- 一時パスワードへのリセット
- メンバーの無効化（履歴保持のため削除しない）
- 店舗単位のログインID重複防止
- 他店舗のデータを操作できないstore scope検証

## 主なAPI

```text
GET    /api/v1/health

POST   /api/v1/auth/login
GET    /api/v1/auth/me
POST   /api/v1/auth/logout
POST   /api/v1/auth/change-password

GET    /api/v1/members
POST   /api/v1/members
PATCH  /api/v1/members/:id
POST   /api/v1/members/:id/reset-password
POST   /api/v1/members/:id/deactivate
```

Manager専用ルートでは、次の順序でアクセス制御を行います。

```ts
requireAuth,
requirePasswordChanged,
requireManager,
controller
```

## 技術スタック

### Frontend（採用予定・現在はVite scaffoldのみ）

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Axios
- TanStack Query

### Backend

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- Zod
- bcrypt
- JSON Web Token
- HttpOnly Cookie

## データ設計上のポイント

- `User`：個人のアカウントとパスワード
- `Store`：店舗
- `StoreMember`：店舗ごとのログインID、権限、状態、表示色
- ログインIDは先頭の0を保持するため数値ではなく文字列として保存
- ログインIDはグローバルではなく店舗内で一意
- ManagerとStaffは別テーブルに分けず、`StoreMember.role`で区別
- メンバーは削除せず`INACTIVE`にして、将来のシフト履歴を保持

## Repository structure

```text
shift-management-system/
├── client/                 # React + TypeScript
├── server/                 # Express + TypeScript
│   ├── prisma/
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       ├── schemas/
│       ├── services/
│       └── scripts/
├── PROJECT_SPEC.md         # Version 1の要件と業務ルール
├── PROJECT_PROGRESS.md     # 実装状況と再開地点
└── README.md
```

## ローカル開発

### 必要環境

- Node.js 20+
- PostgreSQL 17+
- npm

### Server setup

```bash
cd server
npm install
```

`server/.env.example`を参考に`server/.env`を作成し、データベースURL、JWT secret、seed用の一時パスワードなどを設定します。実際の`.env`はGit管理対象外です。

```bash
npx prisma validate
npx prisma migrate dev
npx prisma generate
npx prisma db seed
npm run dev
```

APIはデフォルトで次のURLから起動します。

```text
http://localhost:3000
```

### Build check

```bash
npm run build
```

## 今後の実装予定

1. ScheduleDay、CoverageRequirement、Shiftのバックエンド
2. シフト重複・勤務時間・人員不足の検証
3. Draft作成、公開、編集、キャンセル、Copy Week
4. Login、パスワード変更、シフト表示・編集のフロントエンド
5. 代替依頼、立候補、直接オファー、最終承認
6. アプリ内通知とStaff／Manager Dashboard
7. Integration test、アクセシビリティ確認、デプロイ

詳細なVersion 1仕様は[PROJECT_SPEC.md](./PROJECT_SPEC.md)、現在の進捗は[PROJECT_PROGRESS.md](./PROJECT_PROGRESS.md)に記録しています。

## 開発形態

- 個人開発
- 要件整理、データ設計、バックエンド、フロントエンド、テストを一人で担当
- 機能を小さな単位で実装・検証・commitするincremental developmentを採用

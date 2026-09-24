# Shift Management System

コンビニエンスストアの紙ベースのシフト管理をデジタル化するために開発している、フルスタックWebアプリケーションです。

スタッフが公開済みシフトを店舗外から安全に確認でき、マネージャーがシフトの作成・公開・変更・欠員対応を一元管理できるシステムを目指しています。

> **Status:** Work in Progress（開発中）
> 認証・認可、スタッフ管理、シフト作成・公開などのコアバックエンドを実装済みです。現在はフロントエンドの実装準備を進めています。代替勤務ワークフローと通知機能は今後実装予定です。

## 背景と解決したい課題

勤務先ではシフト表を紙で管理しているため、スタッフは店舗に行かなければ予定を確認できません。また、欠勤時の代替スタッフ探しをLINEで行うため、多くのやり取りが発生します。

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
- Zodによるbody、URL parameter、queryの検証
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
- 保護されたリクエストごとの所属情報再確認

### スタッフ管理

- 店舗メンバー一覧取得
- Staffアカウント作成
- 氏名・ログインID・表示色の編集
- 一時パスワードへのリセット
- メンバーの無効化
- 店舗単位のログインID重複防止
- 他店舗のデータを操作できないstore scope検証
- 将来の有効なシフトがあるメンバーの無効化防止

### シフト管理

- `ScheduleDay`、`CoverageRequirement`、`Shift`のデータモデル
- 指定期間のシフト一覧取得
- Draftシフトの作成・編集・削除
- 複数スタッフへの一括シフト作成
- 日付範囲によるシフト公開
- 公開済みシフトの編集とキャンセル
- Staffには公開済みシフトのみ表示
- Copy Weekのpreviewと実行
- Draft期間削除のpreviewと実行
- 公開済み期間の誤削除防止

### シフト検証と人員不足警告

- 店舗タイムゾーンを考慮した日時処理
- 30分単位の勤務時間検証
- 勤務時間に基づく休憩時間の自動計算
- 同一スタッフのシフト重複防止
- 連続するシフトへのwarning
- シフト枠ごとの必要人数設定
- 30分単位の人員不足計算とwarning

## 主なAPI

### Health

```text
GET    /api/v1/health
```

### Authentication

```text
POST   /api/v1/auth/login
GET    /api/v1/auth/me
POST   /api/v1/auth/logout
POST   /api/v1/auth/change-password
```

### Members

```text
GET    /api/v1/members
POST   /api/v1/members
PATCH  /api/v1/members/:id
POST   /api/v1/members/:id/reset-password
POST   /api/v1/members/:id/deactivate
```

### Schedule days

```text
GET     /api/v1/schedule-days?from=YYYY-MM-DD&to=YYYY-MM-DD
POST    /api/v1/schedule-days/publish
POST    /api/v1/schedule-days/copy-week
DELETE  /api/v1/schedule-days/draft-range
```

### Shifts and coverage

```text
POST    /api/v1/shifts
PATCH   /api/v1/shifts/:id
DELETE  /api/v1/shifts/:id

PATCH   /api/v1/coverage-requirements/:id
```

Manager専用ルートでは、基本的に次の順序でアクセス制御を行います。

```ts
requireAuth,
requirePasswordChanged,
requireManager,
validationMiddleware,
controller
```

## 技術スタック

### Frontend

現在はViteのscaffoldのみ作成済みで、以下の構成を予定しています。

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

- `User`：個人のアカウント情報とパスワード
- `Store`：店舗情報とタイムゾーン
- `StoreMember`：店舗ごとのログインID、権限、状態、表示色
- `ShiftPreset`：店舗で使用する基本シフト枠
- `ScheduleDay`：店舗ごとの日別スケジュールと公開状態
- `CoverageRequirement`：シフト枠ごとの必要人数
- `Shift`：担当メンバー、勤務時間、状態、変更履歴

その他の設計ルール：

- ログインIDは先頭の0を保持するため文字列として保存
- ログインIDはグローバルではなく店舗内で一意
- ManagerとStaffは別テーブルに分けず、`StoreMember.role`で区別
- メンバーは削除せず`INACTIVE`にして履歴を保持
- Draftシフトの削除は物理削除
- 公開済みシフトは削除せず`CANCELLED`にして履歴を保持
- API操作は認証済みメンバーの`storeId`で店舗範囲を制限

## Repository structure

```text
shift-management-system/
├── client/                 # React + TypeScript
├── server/                 # Express + TypeScript
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       ├── schemas/
│       ├── services/
│       ├── scripts/
│       └── utils/
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

1. ログイン、初回パスワード変更、保護された画面遷移
2. Manager向けスタッフ管理画面
3. Manager向けシフトカレンダーと編集画面
4. Staff向け公開済みシフト確認画面
5. 代替依頼、立候補、直接オファー、候補者選定
6. アプリ内通知とStaff／Manager Dashboard
7. 自動テスト、アクセシビリティ確認、デプロイ

詳細なVersion 1仕様は[PROJECT_SPEC.md](./PROJECT_SPEC.md)、現在の進捗は[PROJECT_PROGRESS.md](./PROJECT_PROGRESS.md)に記録しています。

## 開発形態

- 個人開発
- 要件整理、データ設計、バックエンド、フロントエンド、テストを一人で担当
- 機能を小さな単位で実装・検証・commitするincremental developmentを採用

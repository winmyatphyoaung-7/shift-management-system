# Shift Management System

コンビニエンスストアの紙ベースのシフト管理と、LINEで行われている欠員対応をデジタル化するために開発したフルスタックWebアプリケーションです。

スタッフは公開済みシフトや交代募集を確認でき、マネージャーはスタッフ、シフト、人員要件、交代依頼、通知を一元管理できます。

> **Status:** Version 1 feature complete
> **Last verified:** 2026-10-26
> ローカル環境でのビルド、Lint、Prisma検証、マイグレーション確認、主要業務フローの手動E2Eテストが完了しています。

## 背景と目的

勤務先ではシフト表を紙で管理しているため、スタッフは店舗に行かなければ勤務予定を確認できません。また、欠勤時の代替スタッフ探しをLINEで行うため、多くの確認や連絡が必要になります。

本プロジェクトでは、次の課題解決を目指しました。

- 公開済みシフトを店舗外から確認できるようにする
- マネージャーのシフト作成・公開・変更作業を効率化する
- 必要人数と実際の配置人数を比較し、人員不足を可視化する
- 交代依頼、立候補、直接オファー、候補者選定をアプリ内で完結させる
- シフト変更や交代処理を対象ユーザーへ通知する
- ManagerとStaffの操作権限を明確に分離する

## Version 1の主な機能

### 認証・認可

- ログインIDとパスワードによる認証
- bcryptによるパスワードハッシュ化
- JWTをHttpOnly Cookieへ保存
- 初回ログインおよびパスワードリセット後の変更強制
- ログイン試行へのRate Limit
- ACTIVEメンバーのみログイン可能
- リクエストごとの所属店舗・権限・メンバー状態の再確認
- Manager専用ルートとStaff専用ルートの保護
- ログアウトとセッション復元

### メンバー管理

- Staffアカウントの作成
- メンバー一覧、検索、状態表示
- 氏名、ログインID、表示色の編集
- 一時パスワードへのリセット
- メンバーの無効化
- 店舗内でのログインID重複防止
- 現在または将来の有効シフトがあるメンバーの無効化防止
- 未解決の交代依頼があるメンバーの無効化防止
- INACTIVEメンバーへの新規シフト割り当て・直接オファー防止
- 無効化後も過去のシフトや交代履歴を保持

### シフト管理

- 週単位のシフト表示
- Draftシフトの作成、編集、削除
- 複数スタッフへの一括シフト作成
- 日付範囲によるスケジュール公開
- 公開済みシフトの編集とキャンセル
- 公開済みシフト変更時の通知
- 週単位のシフトコピー（preview・confirm）
- Draft期間の一括削除（preview・confirm）
- 人員要件の編集
- 30分単位の人員不足計算
- 店舗タイムゾーンを考慮した日時処理
- 日をまたぐシフトへの対応
- 30分単位の時刻検証
- 24時間以上のシフト作成防止
- 勤務時間に基づく休憩時間の自動計算
- 同一スタッフのシフト重複防止
- 連続するシフトへのwarning
- 開始済みシフトの作成・変更・削除・公開防止

### 交代依頼

- Staffによる自分のシフトの交代申請
- Managerによる申請の承認・却下
- Managerによる緊急の交代募集
- 回答期限の設定と延長
- 期限切れ依頼の自動更新
- Staffによる公開募集への立候補
- 立候補の取り下げ
- Managerによる複数Staffへの直接オファー
- Staffによる直接オファーの承諾・辞退
- Managerによる候補者の最終選定
- 最終承認時のShift担当者変更
- 選定候補者と非選定候補者への通知
- 依頼者またはManagerによる交代依頼のキャンセル
- 同一Shiftに対する複数の有効な交代依頼の防止
- 候補者の重複Shift確認
- Serializable transactionと状態付きupdateによる競合対策

### Dashboard・通知

- Manager Dashboard
  - 確認待ちの交代依頼
  - 期限注意の交代依頼
  - 最終承認待ち
  - 今後の人員不足
  - 未公開日
  - 未読通知
- Staff Dashboard
  - 次の勤務予定
  - 未読通知
  - 回答待ちの直接オファー
  - 自分の有効な交代依頼
  - 募集中の交代依頼
- 通知一覧
- 個別既読・一括既読
- 通知から対象のシフトや交代依頼へ移動するdeep link
- 対象データのhighlight表示

## 技術スタック

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Axios
- ESLint

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
- express-rate-limit

## API構成

```text
/api/v1/health
/api/v1/auth
/api/v1/members
/api/v1/schedule-days
/api/v1/shifts
/api/v1/coverage-requirements
/api/v1/coverage-requests
/api/v1/notifications
/api/v1/dashboard
```

各APIでは、認証情報に含まれる`storeId`を使用して店舗単位のデータアクセスを制限しています。

## データ設計上のポイント

- `User`：個人のアカウント情報とパスワード
- `Store`：店舗情報とタイムゾーン
- `StoreMember`：店舗ごとのログインID、権限、状態、表示色
- `ShiftPreset`：店舗で使用する基本シフト枠
- `ScheduleDay`：店舗ごとの日別スケジュールと公開状態
- `CoverageRequirement`：シフト枠ごとの必要人数
- `Shift`：担当メンバー、勤務時間、状態、変更履歴
- `CoverageRequest`：交代依頼と進行状態
- `CoverageCandidate`：立候補・直接オファーと回答状態
- `Notification`：ユーザーごとのアプリ内通知

主な設計ルール：

- ログインIDは先頭の0を保持できる文字列として保存
- ログインIDは店舗内で一意
- ManagerとStaffは`StoreMember.role`で区別
- メンバーは削除せず`INACTIVE`にして履歴を保持
- Draftシフトは物理削除
- 公開済みシフトは`CANCELLED`にして履歴を保持
- 交代処理完了後も依頼・候補者履歴を保持
- 同一Shiftの有効な交代依頼はデータベースの部分ユニークインデックスでも制限

## Repository structure

```text
shift-management-system/
├── client/
│   └── src/
│       ├── features/
│       ├── layouts/
│       ├── lib/
│       └── pages/
├── server/
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
│       └── utils/
└── README.md
```

## ローカル開発

### 必要環境

- Node.js 20+
- npm
- PostgreSQL 17+

### 1. Server setup

```bash
cd server
npm install
```

`server/.env.example`をコピーして`server/.env`を作成し、環境に合わせて値を設定します。

```env
DATABASE_URL="postgresql://shift_app:YOUR_URL_ENCODED_PASSWORD@localhost:5432/shift_management?schema=public"
SHADOW_DATABASE_URL="postgresql://shift_app:YOUR_URL_ENCODED_PASSWORD@localhost:5432/shift_management_shadow?schema=public"
SEED_MANAGER_TEMP_PASSWORD="CHANGE_ME_AT_LEAST_12_CHARACTERS"
PORT=3000
CLIENT_ORIGIN="http://localhost:5173"
JWT_SECRET="GENERATE_A_RANDOM_SECRET_AT_LEAST_32_CHARACTERS"
JWT_EXPIRES_IN_SECONDS=28800
```

データベースを準備します。

```bash
npx prisma validate
npx prisma migrate dev
npx prisma generate
npx prisma db seed
```

Serverを起動します。

```bash
npm run dev
```

APIはデフォルトで`http://localhost:3000`から起動します。

### 2. Client setup

別のターミナルで実行します。

```bash
cd client
npm install
```

`client/.env.example`をコピーして`client/.env`を作成します。

```env
VITE_API_BASE_URL="http://localhost:3000/api/v1"
```

Clientを起動します。

```bash
npm run dev
```

ブラウザから`http://localhost:5173`を開きます。

## 品質確認

### Server

```bash
cd server
npm run build
npx prisma validate
npx prisma migrate status
```

### Client

```bash
cd client
npm run build
npm run lint
```

Version 1では、以下の主要フローをブラウザで手動E2E確認しています。

- Login、初回パスワード変更、Logout
- Manager／Staffのroute protection
- メンバー作成、編集、パスワードリセット、無効化
- シフト作成、編集、重複防止、公開、公開後変更、キャンセル
- 人員要件、週コピー、Draft期間削除
- Staff申請、Manager承認・却下
- 立候補、取り下げ
- 直接オファー、承諾・辞退
- 回答期限延長
- 候補者最終選定とShift担当者変更
- 交代依頼キャンセル
- 通知、既読、deep link
- Dashboard集計とaction link

## Version 1の範囲外

- 自動テストスイート
- 本番環境へのデプロイ
- メール・Push通知
- 複数店舗を切り替えるUI
- 希望シフト提出
- 勤怠・給与計算

これらはVersion 2以降で検討します。

## 開発形態

- 個人開発
- 要件整理、データ設計、バックエンド、フロントエンド、手動テストを一人で担当
- 機能を小さな単位で実装・検証・commitするincremental developmentを採用
- Version 1完成後は、設計と実装を体系的に学び直し、Version 2では自力実装の割合を高める予定

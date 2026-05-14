# Cafe Navi DB

## 目的
ログインユーザー情報とお気に入り情報を永続化するためのDB定義です。

## ファイル
- `schema.sql`: テーブル作成
- `seed.sql`: カフェの初期データ投入

## 想定テーブル
- `users`: アカウント情報
- `cafes`: カフェマスタ
- `favorites`: ユーザーお気に入り
- `user_sessions`: ログインセッション

## 実行例 (MySQL)
```sql
SOURCE /path/to/cafe-navi/db/schema.sql;
SOURCE /path/to/cafe-navi/db/seed.sql;
```

## 実装時の注意
- `password_hash` には平文ではなく `bcrypt` 等でハッシュ化した値を保存してください。
- `favorites` は `(user_id, cafe_id)` を一意制約にしているため二重登録されません。

# Nodewar Server (拠点戦くん)

オンラインゲーム「黒い砂漠」の拠点戦用カウントダウンタイマーアプリケーションです。
ギルドメンバーと共有して、敵の砦が破壊されるまでの時間をリアルタイムで管理・共有できます。

## 🚀 機能

- **リアルタイムタイマー**: 設定された「破壊時刻」までのカウントダウンを表示します。
- **時刻同期**: サーバーと時刻同期を行い、全員が同じ残り時間を見られるように調整されています。
- **音声通知**: 設定時間が来ると音が鳴ります。
- **管理画面**: タイマーの追加・削除、遅延秒数の調整が可能です（要認証）。

## 🛠️ 技術スタック

- **Backend**: Node.js (Express)
- **Database**: MongoDB (Mongoose)
- **Frontend**: HTML5, CSS3, Vanilla JavaScript

## 📦 インストールとセットアップ

### 前提条件

- [Node.js](https://nodejs.org/) (v14以上推奨 - ES Modules対応)
- [MongoDB](https://www.mongodb.com/) (ローカルまたはクラウド)

### 手順

1. **リポジトリのクローン**
   ```bash
   git clone https://github.com/h1dia/nodewar-server.git
   cd nodewar-server
   ```

2. **依存関係のインストール**
   ```bash
   npm install
   ```

3. **環境変数の設定**
   プロジェクトルートに `.env` ファイルを作成し、以下の変数を設定してください。

   ```env
   # サーバーポート (省略時: 3000)
   PORT=3000

   # MongoDB接続URI (必須)
   MONGODB_URI=mongodb://localhost:27017/nodewar

   # 管理画面用 Basic認証 (省略時: admin / password)
   ADMIN_USER=admin
   ADMIN_PASS=password
   ```

4. **アプリケーションの起動**
   ```bash
   npm start
   ```

   サーバーが起動すると、以下のURLでアクセスできます。
   - **タイマー画面**: [http://localhost:3000](http://localhost:3000)
   - **管理画面**: [http://localhost:3000/admin](http://localhost:3000/admin)

## 📁 プロジェクト構成

```text
nodewar-server/
├── public/              # 静的ファイル (Frontend)
│   ├── css/             # スタイルシート
│   ├── js/              # クライアントサイドスクリプト
│   ├── index.html       # タイマー表示画面
│   └── admin.html       # 管理画面
├── src/                 # サーバーサイドコード (Backend)
│   ├── config/          # 設定ファイル (DB接続など)
│   ├── models/          # データベースモデル
│   ├── routes/          # APIルート定義
│   ├── middleware/      # ミドルウェア (認証など)
│   └── app.js           # Expressアプリ設定
├── server.js            # エントリーポイント
└── package.json         # プロジェクト設定
```

## 📝 ライセンス

このプロジェクトは [MIT License](LICENSE) の下で公開されています。

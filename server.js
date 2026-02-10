const express = require('express');
const basicAuth = require('express-basic-auth');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// --- MongoDB接続設定 ---
// Renderの環境変数から取得します。ローカルテスト用には || 以降を書き換えてもOKですが、
// セキュリティのため環境変数推奨です。
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("【エラー】MONGODB_URI が設定されていません。Renderの環境変数を設定してください。");
    // 接続できない場合でもサーバー自体は落とさず、エラーを返すようにする
} else {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log('✅ MongoDB Connected'))
        .catch(err => console.error('❌ MongoDB Connection Error:', err));
}

// --- データモデル定義 ---
// タイマー個別のデータ構造
const TimerSchema = new mongoose.Schema({
    label: String,
    time: String
});
const Timer = mongoose.model('Timer', TimerSchema);

// 設定（遅延秒数など）のデータ構造
const SettingSchema = new mongoose.Schema({
    key: { type: String, unique: true },
    value: Number
});
const Setting = mongoose.model('Setting', SettingSchema);

// --- ミドルウェア設定 ---
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // publicフォルダを配信

// --- Basic認証の設定 (管理画面用) ---
// 環境変数でID/PASSを設定。なければデフォルト admin / password
const adminUser = process.env.ADMIN_USER || 'admin';
const adminPass = process.env.ADMIN_PASS || 'password';
const users = {};
users[adminUser] = adminPass;

const authMiddleware = basicAuth({
    users: users,
    challenge: true,
    realm: 'NodeWar Admin Area'
});

// --- APIルート ---

// 1. データ取得 (一般公開)
app.get('/api/data', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            throw new Error("Database not connected");
        }

        // 遅延設定を取得
        let delayDoc = await Setting.findOne({ key: 'delay' });
        // データがなければ初期値0で作る
        if (!delayDoc) {
            delayDoc = await Setting.create({ key: 'delay', value: 0 });
        }

        // タイマーリストを取得
        const timers = await Timer.find({});

        res.json({
            delaySeconds: delayDoc.value,
            timers: timers
        });
    } catch (err) {
        console.error(err);
        // DB未接続時はダミーデータを返して画面が真っ白になるのを防ぐ
        res.status(503).json({ 
            delaySeconds: 0, 
            timers: [], 
            error: "データベース接続待機中..." 
        });
    }
});

// 2. 管理画面へのアクセス (要認証)
app.use('/admin', authMiddleware, express.static('public/admin.html'));
// ※ /admin にアクセスすると public/admin.html を返すのではなく
// staticの設定でファイルを直接返すため、ここではルート保護のみ行う
app.get('/admin', authMiddleware, (req, res) => {
    res.sendFile(__dirname + '/public/admin.html');
});

// 3. データ更新 (要認証)
app.post('/api/update', authMiddleware, async (req, res) => {
    try {
        const { delaySeconds, timers } = req.body;

        // 遅延秒数を更新
        await Setting.findOneAndUpdate(
            { key: 'delay' },
            { value: delaySeconds },
            { upsert: true, new: true }
        );

        // タイマーを全削除して登録し直す（同期ズレ防止のため全置換）
        await Timer.deleteMany({});
        if (timers && timers.length > 0) {
            await Timer.insertMany(timers);
        }

        res.json({ success: true, message: "更新完了" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// サーバー起動
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
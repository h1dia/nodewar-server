const express = require('express');
const basicAuth = require('express-basic-auth');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// --- MongoDB接続 ---
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("【警告】MONGODB_URI が設定されていません。Renderの環境変数を設定してください。");
} else {
    mongoose.connect(MONGODB_URI)
        .then(() => console.log('✅ MongoDB Connected'))
        .catch(err => console.error('❌ MongoDB Connection Error:', err));
}

// --- データモデル ---
const TimerSchema = new mongoose.Schema({
    label: String,
    minutes: Number // 分数として保存
});
const Timer = mongoose.model('Timer', TimerSchema);

const SettingSchema = new mongoose.Schema({
    key: { type: String, unique: true },
    value: Number
});
const Setting = mongoose.model('Setting', SettingSchema);

// --- ミドルウェア ---
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// --- Basic認証 (管理画面用) ---
const adminUser = process.env.ADMIN_USER || 'admin';
const adminPass = process.env.ADMIN_PASS || 'password';
const users = {};
users[adminUser] = adminPass;
const authMiddleware = basicAuth({ users: users, challenge: true });

// --- API ---

// 1. データ取得
app.get('/api/data', async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) throw new Error("DB Disconnected");

        let delayDoc = await Setting.findOne({ key: 'delay' });
        if (!delayDoc) delayDoc = await Setting.create({ key: 'delay', value: 0 });

        const timers = await Timer.find({});

        res.json({
            delaySeconds: delayDoc.value,
            timers: timers
        });
    } catch (err) {
        console.error(err);
        res.status(503).json({ delaySeconds: 0, timers: [], error: "DB Error" });
    }
});

// 2. 管理画面ルート
app.get('/admin', authMiddleware, (req, res) => {
    res.sendFile(__dirname + '/public/admin.html');
});

// 3. データ更新
app.post('/api/update', authMiddleware, async (req, res) => {
    try {
        const { delaySeconds, timers } = req.body;

        await Setting.findOneAndUpdate(
            { key: 'delay' },
            { value: delaySeconds },
            { upsert: true }
        );

        await Timer.deleteMany({});
        if (timers && timers.length > 0) {
            await Timer.insertMany(timers.map(t => ({
                label: t.label,
                minutes: parseInt(t.minutes, 10)
            })));
        }

        res.json({ success: true, message: "更新完了" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
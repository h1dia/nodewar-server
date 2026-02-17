import express from 'express';
import mongoose from 'mongoose';
import Timer from '../models/Timer.js';
import Setting from '../models/Setting.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// 1. データ取得
router.get('/data', async (req, res) => {
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

// 3. データ更新
router.post('/update', authMiddleware, async (req, res) => {
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

export default router;

import express from 'express';
import mongoose from 'mongoose';
import DataService from '../services/dataService.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// 1. データ取得
router.get('/data', async (req, res) => {
    try {
        const data = await DataService.getData();
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(503).json({ delaySeconds: 0, timers: [], error: "Data Error" });
    }
});

// 3. データ更新
router.post('/update', authMiddleware, async (req, res) => {
    try {
        const { delaySeconds, timers } = req.body;
        await DataService.updateData(delaySeconds, timers);
        res.json({ success: true, message: "更新完了" });
    } catch (err) {
        console.error(err); // Log the error for debugging
        res.status(500).json({ success: false, error: err.message });
    }
});

export default router;

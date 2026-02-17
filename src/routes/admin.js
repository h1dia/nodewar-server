import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import authMiddleware from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// 2. 管理画面ルート
router.get('/', authMiddleware, (req, res) => {
    // __dirname is src/routes, so we need to go up two levels to reach root, then into public
    res.sendFile(path.join(__dirname, '../../public/admin.html'));
});

export default router;

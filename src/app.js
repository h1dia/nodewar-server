import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import apiRoutes from './routes/api.js';
import adminRoutes from './routes/admin.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- ミドルウェア ---
app.use(cors());
app.use(bodyParser.json());
// src/app.js から見て ../public が静的ファイルの場所
app.use(express.static(path.join(__dirname, '../public')));

// --- ルーティング ---
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);

export default app;

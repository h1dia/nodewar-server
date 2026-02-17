import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    const MONGODB_URI = process.env.MONGODB_URI;

    if (!MONGODB_URI) {
        console.error("【警告】MONGODB_URI が設定されていません。Renderの環境変数を設定してください。");
        // 開発環境などでDBなしで動かす場合を考慮し、exitしない実装も考えられるが、
        // 現状のserver.jsの挙動（エラーログのみ）に合わせる。
        // ただし、mongoose.connectのエラーキャッチはserver.jsにある通りに行う。
    } else {
        try {
            await mongoose.connect(MONGODB_URI);
            console.log('✅ MongoDB Connected');
        } catch (err) {
            console.error('❌ MongoDB Connection Error:', err);
            // 接続エラー時はプロセス終了が良い場合もあるが、既存挙動に合わせてログのみにするか検討。
            // 今回は明示的にエラーログを出す構造にする。
        }
    }
};

export default connectDB;

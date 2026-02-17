import mongoose from 'mongoose';

const TimerSchema = new mongoose.Schema({
    label: String,
    minutes: Number // 分数として保存
});

const Timer = mongoose.model('Timer', TimerSchema);

export default Timer;

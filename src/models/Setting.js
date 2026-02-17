import mongoose from 'mongoose';

const SettingSchema = new mongoose.Schema({
    key: { type: String, unique: true },
    value: mongoose.Schema.Types.Mixed
});

const Setting = mongoose.model('Setting', SettingSchema);

export default Setting;

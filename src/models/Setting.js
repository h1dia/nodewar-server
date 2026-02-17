import mongoose from 'mongoose';

const SettingSchema = new mongoose.Schema({
    key: { type: String, unique: true },
    value: Number
});

const Setting = mongoose.model('Setting', SettingSchema);

export default Setting;

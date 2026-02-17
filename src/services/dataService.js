import mongoose from 'mongoose';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Timer from '../models/Timer.js';
import Setting from '../models/Setting.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'local_db.json');

// Ensure data directory exists
const ensureDataDir = async () => {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
};

const getLocalData = async () => {
    await ensureDataDir();
    try {
        const data = await fs.readFile(DATA_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // Default data if file doesn't exist
            return { delaySeconds: 0, timers: [] };
        }
        throw error;
    }
};

const saveLocalData = async (data) => {
    await ensureDataDir();
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

const isMongoConnected = () => {
    return mongoose.connection.readyState === 1;
};

const DataService = {
    async getData() {
        if (isMongoConnected()) {
            try {
                let delayDoc = await Setting.findOne({ key: 'delay' });
                if (!delayDoc) delayDoc = await Setting.create({ key: 'delay', value: 0 });
                const timers = await Timer.find({});

                return {
                    delaySeconds: delayDoc.value,
                    timers: timers
                };
            } catch (err) {
                console.error("MongoDB Read Error, falling back to local:", err);
            }
        }
        // Fallback or Not Connected
        console.log("Using Local File Storage (Read)");
        return await getLocalData();
    },

    async updateData(delaySeconds, timersData) {
        if (isMongoConnected()) {
            try {
                await Setting.findOneAndUpdate(
                    { key: 'delay' },
                    { value: delaySeconds },
                    { upsert: true }
                );

                await Timer.deleteMany({});
                if (timersData && timersData.length > 0) {
                    await Timer.insertMany(timersData.map(t => ({
                        label: t.label,
                        minutes: parseInt(t.minutes, 10)
                    })));
                }
                return;
            } catch (err) {
                console.error("MongoDB Write Error, falling back to local:", err);
            }
        }

        // Fallback or Not Connected
        console.log("Using Local File Storage (Write)");
        const data = {
            delaySeconds,
            timers: timersData.map(t => ({
                label: t.label,
                minutes: parseInt(t.minutes, 10)
            }))
        };
        await saveLocalData(data);
    }
};

export default DataService;

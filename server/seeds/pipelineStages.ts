/**
 * Seed default pipeline stages.
 * Run: npx tsx server/seeds/pipelineStages.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ override: false });

const MONGODB_URI =
    process.env.MONGODB_URI ||
    process.env.MONGODB_URL ||
    process.env.MONGO_URL ||
    process.env.DATABASE_URL ||
    '';

if (!MONGODB_URI) {
    console.error('❌ No MongoDB URI found. Set MONGODB_URI in .env');
    process.exit(1);
}

// Import model after dotenv
import PipelineStage from '../models/PipelineStage.js';

const DEFAULT_STAGES = [
    { name: 'New Lead', order: 1, color: '#6B7280', probability: 5, isDefault: true, description: 'Freshly added lead' },
    { name: 'In Progress', order: 2, color: '#3B82F6', probability: 15, description: 'SDR assigned — working the lead' },
    { name: 'Contacted', order: 3, color: '#06B6D4', probability: 30, description: 'Initial contact made' },
    { name: 'Appointment Set', order: 4, color: '#F59E0B', probability: 60, description: 'Meeting scheduled with prospect' },
    { name: 'Active Account', order: 5, color: '#10B981', probability: 100, description: 'Lead converted to active account' },
];

async function seedStages() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const existing = await PipelineStage.countDocuments();
        if (existing > 0) {
            console.log(`[SEED] ${existing} pipeline stages already exist — skipping.`);
        } else {
            await PipelineStage.insertMany(DEFAULT_STAGES);
            console.log(`[SEED] ✅ Created ${DEFAULT_STAGES.length} default pipeline stages.`);
        }
    } catch (err) {
        console.error('[SEED] ❌ Failed:', err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

seedStages();

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
    { name: 'New', order: 1, color: '#6B7280', probability: 5, isDefault: true, description: 'Freshly added lead' },
    { name: 'Contacted', order: 2, color: '#3B82F6', probability: 15, description: 'Initial contact made' },
    { name: 'Qualified', order: 3, color: '#8B5CF6', probability: 30, description: 'Lead is qualified' },
    { name: 'Proposal', order: 4, color: '#F59E0B', probability: 50, description: 'Proposal sent' },
    { name: 'Negotiation', order: 5, color: '#EF4444', probability: 70, description: 'In negotiations' },
    { name: 'Won', order: 6, color: '#10B981', probability: 100, description: 'Deal closed — won' },
    { name: 'Lost', order: 7, color: '#DC2626', probability: 0, description: 'Deal closed — lost' },
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

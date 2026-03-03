/**
 * Seed default admin and team users.
 * Run: npx tsx server/seeds/defaultAdmin.ts
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

import User from '../models/User.js';

async function seedAdmin() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
            console.log(`[SEED] Admin user already exists (${adminExists.email}) — skipping.`);
        } else {
            const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'changeme123';
            const teamPassword = process.env.SEED_TEAM_PASSWORD || 'Team2026!';

            await User.create([
                { name: 'Admin', email: 'admin@company.com', password: adminPassword, avatar: 'AD', role: 'admin' },
                { name: 'Chiren', email: 'chiren@ualliances.com', password: adminPassword, avatar: 'CH', role: 'admin' },
                { name: 'Rajesh Patel', email: 'rajesh@ualliances.com', password: teamPassword, avatar: 'RP', role: 'sdr' },
                { name: 'Priya Sharma', email: 'priya@ualliances.com', password: teamPassword, avatar: 'PS', role: 'sdr' },
                { name: 'Amit Desai', email: 'amit@ualliances.com', password: teamPassword, avatar: 'AD', role: 'closer' },
                { name: 'Deepa Joshi', email: 'deepa@ualliances.com', password: teamPassword, avatar: 'DJ', role: 'hr' },
                { name: 'Karan Shah', email: 'karan@ualliances.com', password: teamPassword, avatar: 'KS', role: 'lead_gen' },
                { name: 'Sanjay Gupta', email: 'sanjay@ualliances.com', password: teamPassword, avatar: 'SG', role: 'manager' },
            ]);
            console.log('[SEED] ✅ Created default users:');
            console.log('  admin@company.com (admin)');
            console.log('  chiren@ualliances.com (admin)');
            console.log('  rajesh, priya (sdr), amit (closer), deepa (hr), karan (lead_gen), sanjay (manager)');
        }
    } catch (err) {
        console.error('[SEED] ❌ Failed:', err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

seedAdmin();

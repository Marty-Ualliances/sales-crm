import mongoose from 'mongoose';
import * as fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

// Temporary schema definition
const LeadSchema = new mongoose.Schema({
    status: String,
    assignedAgent: String,
    activities: [
        { type: { type: String }, description: String, timestamp: Date, agent: String }
    ]
}, { strict: false });

const Lead = mongoose.models.Lead || mongoose.model('Lead', LeadSchema);

async function runAudit() {
    try {
        await mongoose.connect(uri!);

        const totalLeads = await Lead.countDocuments();

        // Check what is currently considered an 'Appointment Booked' or equivalent
        const totalAppointments = await Lead.countDocuments({
            status: { $in: ['Meeting Booked', 'Meeting Completed'] }
        });

        const allRecentEvents = await Lead.find({ 'activities.0': { $exists: true } }).select('activities -_id').lean();
        let eventCounts: Record<string, number> = {};
        for (const doc of allRecentEvents as any[]) {
            for (const act of doc.activities || []) {
                eventCounts[act.type] = (eventCounts[act.type] || 0) + 1;
            }
        }

        const output = {
            totalLeads,
            totalAppointments,
            eventCounts
        };

        fs.writeFileSync('audit_out.json', JSON.stringify(output, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

runAudit();

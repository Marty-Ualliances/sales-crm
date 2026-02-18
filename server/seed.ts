import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User';
import Lead from './models/Lead';
import Call from './models/Call';
import Notification from './models/Notification';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/insurelead';

const today = new Date();
const ago = (days: number) => new Date(today.getTime() - days * 86400000);
const future = (days: number) => new Date(today.getTime() + days * 86400000);

async function seed() {
  await mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 60000,
    family: 4, // Force IPv4
  });
  console.log('Connected to MongoDB');

  // Clear existing data
  await User.deleteMany({});
  await Lead.deleteMany({});
  await Call.deleteMany({});
  await Notification.deleteMany({});
  console.log('Cleared existing data');

  // --- Users ---
  const users = await User.create([
    { name: 'Sarah Johnson', email: 'admin@insurelead.com', password: 'admin123', avatar: 'SJ', role: 'admin', leadsAssigned: 45, callsMade: 128, followUpsCompleted: 34, followUpsPending: 8, conversionRate: 24, revenueClosed: 128500 },
    { name: 'Mike Chen', email: 'mike@insurelead.com', password: 'sdr123', avatar: 'MC', role: 'sdr', leadsAssigned: 38, callsMade: 96, followUpsCompleted: 28, followUpsPending: 12, conversionRate: 18, revenueClosed: 87200 },
    { name: 'Emily Davis', email: 'emily@insurelead.com', password: 'sdr123', avatar: 'ED', role: 'sdr', leadsAssigned: 52, callsMade: 145, followUpsCompleted: 41, followUpsPending: 5, conversionRate: 28, revenueClosed: 156800 },
    { name: 'James Wilson', email: 'james@insurelead.com', password: 'sdr123', avatar: 'JW', role: 'sdr', leadsAssigned: 31, callsMade: 72, followUpsCompleted: 19, followUpsPending: 15, conversionRate: 15, revenueClosed: 54300 },
  ]);
  console.log(`Created ${users.length} users`);

  // --- Leads ---
  const leads = await Lead.create([
    { date: ago(5), source: 'LinkedIn', name: 'Robert Smith', title: 'VP of Operations', companyName: 'Acme Corp', email: 'robert@acmecorp.com', workDirectPhone: '(555) 123-4567', mobilePhone: '(555) 123-9999', homePhone: '', corporatePhone: '(555) 100-0000', otherPhone: '', companyPhone: '(555) 100-0001', employees: 250, personLinkedinUrl: 'https://linkedin.com/in/robertsmith', website: 'https://acmecorp.com', companyLinkedinUrl: 'https://linkedin.com/company/acmecorp', city: 'Dallas', state: 'TX', status: 'New', assignedAgent: 'Sarah Johnson', nextFollowUp: future(1), callCount: 0, lastActivity: ago(0), notes: 'Interested in life insurance', activities: [{ type: 'note', description: 'Lead imported via CSV', timestamp: ago(0), agent: 'Sarah Johnson' }] },
    { date: ago(10), source: 'CSV Import', name: 'Jennifer Brown', title: 'HR Director', companyName: 'TechStart Inc', email: 'jen@techstart.com', workDirectPhone: '(555) 234-5678', mobilePhone: '(555) 234-9999', homePhone: '(555) 234-1111', corporatePhone: '', otherPhone: '', companyPhone: '(555) 234-0000', employees: 85, personLinkedinUrl: 'https://linkedin.com/in/jenniferbrown', website: 'https://techstart.com', companyLinkedinUrl: 'https://linkedin.com/company/techstart', city: 'Austin', state: 'TX', status: 'Contacted', assignedAgent: 'Mike Chen', nextFollowUp: ago(1), callCount: 2, lastActivity: ago(1), notes: 'Needs auto + home bundle', activities: [{ type: 'call', description: 'Initial call - interested', timestamp: ago(2), agent: 'Mike Chen' }, { type: 'call', description: 'Follow-up call - requested quote', timestamp: ago(1), agent: 'Mike Chen' }] },
    { date: ago(15), source: 'LinkedIn', name: 'David Martinez', title: 'CEO', companyName: 'Martinez & Sons LLC', email: 'david@martinezllc.com', workDirectPhone: '(555) 345-6789', mobilePhone: '(555) 345-9999', homePhone: '', corporatePhone: '(555) 345-0000', otherPhone: '', companyPhone: '(555) 345-0001', employees: 42, personLinkedinUrl: 'https://linkedin.com/in/davidmartinez', website: 'https://martinezllc.com', companyLinkedinUrl: 'https://linkedin.com/company/martinezllc', city: 'Miami', state: 'FL', status: 'Follow-up', assignedAgent: 'Emily Davis', nextFollowUp: ago(3), callCount: 4, lastActivity: ago(2), notes: 'Comparing with competitor', activities: [{ type: 'call', description: 'Discussed policy options', timestamp: ago(5), agent: 'Emily Davis' }, { type: 'follow-up', description: 'Scheduled follow-up', timestamp: ago(3), agent: 'Emily Davis' }] },
    { date: ago(30), source: 'Referral', name: 'Lisa Thompson', title: 'CFO', companyName: 'Thompson Financial', email: 'lisa@thompsonfin.com', workDirectPhone: '(555) 456-7890', mobilePhone: '', homePhone: '(555) 456-1111', corporatePhone: '', otherPhone: '', companyPhone: '(555) 456-0000', employees: 120, personLinkedinUrl: 'https://linkedin.com/in/lisathompson', website: 'https://thompsonfin.com', companyLinkedinUrl: 'https://linkedin.com/company/thompsonfin', city: 'Chicago', state: 'IL', status: 'Closed', assignedAgent: 'Sarah Johnson', nextFollowUp: null, callCount: 6, lastActivity: ago(1), notes: 'Signed life insurance policy', revenue: 24500, activities: [{ type: 'status-change', description: 'Status changed to Closed', timestamp: ago(1), agent: 'Sarah Johnson' }] },
    { date: ago(7), source: 'Website', name: 'William Garcia', title: 'Owner', companyName: 'Garcia Auto Services', email: 'will@garciauto.com', workDirectPhone: '(555) 567-8901', mobilePhone: '(555) 567-9999', homePhone: '', corporatePhone: '', otherPhone: '(555) 567-2222', companyPhone: '(555) 567-0000', employees: 18, personLinkedinUrl: '', website: 'https://garciauto.com', companyLinkedinUrl: '', city: 'Phoenix', state: 'AZ', status: 'Follow-up', assignedAgent: 'James Wilson', nextFollowUp: future(2), callCount: 1, lastActivity: ago(3), notes: 'Wants family health plan', activities: [{ type: 'call', description: 'First contact call', timestamp: ago(3), agent: 'James Wilson' }] },
    { date: ago(20), source: 'Referral', name: 'Amanda White', title: 'Marketing Manager', companyName: 'White Media Group', email: 'amanda@whitemedia.com', workDirectPhone: '(555) 678-9012', mobilePhone: '', homePhone: '(555) 678-1111', corporatePhone: '(555) 678-0000', otherPhone: '', companyPhone: '(555) 678-0001', employees: 65, personLinkedinUrl: 'https://linkedin.com/in/amandawhite', website: 'https://whitemedia.com', companyLinkedinUrl: 'https://linkedin.com/company/whitemedia', city: 'Denver', state: 'CO', status: 'Lost', assignedAgent: 'Mike Chen', nextFollowUp: null, callCount: 3, lastActivity: ago(7), notes: 'Went with competitor', activities: [{ type: 'status-change', description: 'Status changed to Lost', timestamp: ago(7), agent: 'Mike Chen' }] },
    { date: ago(1), source: 'Manual', name: 'Thomas Anderson', title: 'CTO', companyName: 'Matrix Solutions', email: 'thomas@matrixsol.com', workDirectPhone: '(555) 789-0123', mobilePhone: '(555) 789-9999', homePhone: '', corporatePhone: '(555) 789-0000', otherPhone: '', companyPhone: '(555) 789-0001', employees: 310, personLinkedinUrl: 'https://linkedin.com/in/thomasanderson', website: 'https://matrixsol.com', companyLinkedinUrl: 'https://linkedin.com/company/matrixsol', city: 'Seattle', state: 'WA', status: 'New', assignedAgent: 'Emily Davis', nextFollowUp: future(0), callCount: 0, lastActivity: ago(0), notes: 'Business insurance inquiry', activities: [{ type: 'note', description: 'Lead imported via CSV', timestamp: ago(0), agent: 'Emily Davis' }] },
    { date: ago(8), source: 'CSV Import', name: 'Jessica Lee', title: 'Office Manager', companyName: 'Lee & Partners', email: 'jessica@leepartners.com', workDirectPhone: '(555) 890-1234', mobilePhone: '', homePhone: '(555) 890-1111', corporatePhone: '', otherPhone: '', companyPhone: '(555) 890-0000', employees: 12, personLinkedinUrl: 'https://linkedin.com/in/jessicalee', website: 'https://leepartners.com', companyLinkedinUrl: '', city: 'Portland', state: 'OR', status: 'Contacted', assignedAgent: 'Sarah Johnson', nextFollowUp: ago(2), callCount: 1, lastActivity: ago(2), notes: 'Renters insurance needed', activities: [{ type: 'call', description: 'Intro call completed', timestamp: ago(2), agent: 'Sarah Johnson' }] },
    { date: ago(12), source: 'Website', name: 'Christopher Hall', title: 'President', companyName: 'Hall Senior Living', email: 'chris@hallsenior.com', workDirectPhone: '(555) 901-2345', mobilePhone: '(555) 901-9999', homePhone: '', corporatePhone: '(555) 901-0000', otherPhone: '', companyPhone: '(555) 901-0001', employees: 95, personLinkedinUrl: 'https://linkedin.com/in/christopherhall', website: 'https://hallsenior.com', companyLinkedinUrl: 'https://linkedin.com/company/hallsenior', city: 'Nashville', state: 'TN', status: 'Follow-up', assignedAgent: 'James Wilson', nextFollowUp: ago(5), callCount: 2, lastActivity: ago(4), notes: 'Senior health plan', activities: [{ type: 'follow-up', description: 'Follow-up scheduled', timestamp: ago(5), agent: 'James Wilson' }] },
    { date: ago(3), source: 'LinkedIn', name: 'Sarah Kim', title: 'Director of Sales', companyName: 'Kim Enterprises', email: 'sarahk@kiment.com', workDirectPhone: '(555) 012-3456', mobilePhone: '(555) 012-9999', homePhone: '', corporatePhone: '', otherPhone: '', companyPhone: '(555) 012-0000', employees: 150, personLinkedinUrl: 'https://linkedin.com/in/sarahkim', website: 'https://kiment.com', companyLinkedinUrl: 'https://linkedin.com/company/kiment', city: 'San Francisco', state: 'CA', status: 'Contacted', assignedAgent: 'Emily Davis', nextFollowUp: future(3), callCount: 1, lastActivity: ago(1), notes: 'Auto insurance quote', activities: [{ type: 'call', description: 'Initial contact', timestamp: ago(1), agent: 'Emily Davis' }] },
  ]);
  console.log(`Created ${leads.length} leads`);

  // --- Calls (use lead _id for external references) ---
  const leadMap: Record<string, string> = {};
  leads.forEach(l => { leadMap[l.name] = l._id.toString(); });

  const calls = await Call.create([
    { leadId: leadMap['Jennifer Brown'], leadName: 'Jennifer Brown', agentName: 'Mike Chen', date: ago(1), time: '10:30 AM', duration: '6 min', status: 'Completed', notes: 'Follow-up call - requested quote', hasRecording: true },
    { leadId: leadMap['Jennifer Brown'], leadName: 'Jennifer Brown', agentName: 'Mike Chen', date: ago(2), time: '2:15 PM', duration: '4 min', status: 'Completed', notes: 'Initial call - interested', hasRecording: true },
    { leadId: leadMap['David Martinez'], leadName: 'David Martinez', agentName: 'Emily Davis', date: ago(5), time: '11:00 AM', duration: '8 min', status: 'Completed', notes: 'Discussed policy options', hasRecording: false },
    { leadId: leadMap['William Garcia'], leadName: 'William Garcia', agentName: 'James Wilson', date: ago(3), time: '9:45 AM', duration: '3 min', status: 'Follow-up', notes: 'First contact call', hasRecording: true },
    { leadId: leadMap['Jessica Lee'], leadName: 'Jessica Lee', agentName: 'Sarah Johnson', date: ago(2), time: '3:00 PM', duration: '5 min', status: 'Completed', notes: 'Intro call completed', hasRecording: false },
    { leadId: leadMap['Sarah Kim'], leadName: 'Sarah Kim', agentName: 'Emily Davis', date: ago(1), time: '1:20 PM', duration: '7 min', status: 'Completed', notes: 'Initial contact', hasRecording: true },
    { leadId: leadMap['David Martinez'], leadName: 'David Martinez', agentName: 'Emily Davis', date: ago(7), time: '4:00 PM', duration: '0 min', status: 'Missed', notes: 'No answer', hasRecording: false },
    { leadId: leadMap['Amanda White'], leadName: 'Amanda White', agentName: 'Mike Chen', date: ago(8), time: '10:00 AM', duration: '12 min', status: 'Completed', notes: 'Extended discussion about coverage', hasRecording: true },
    { leadId: leadMap['Lisa Thompson'], leadName: 'Lisa Thompson', agentName: 'Sarah Johnson', date: ago(3), time: '11:30 AM', duration: '15 min', status: 'Completed', notes: 'Closing call - signed policy', hasRecording: true },
    { leadId: leadMap['Christopher Hall'], leadName: 'Christopher Hall', agentName: 'James Wilson', date: ago(4), time: '2:00 PM', duration: '4 min', status: 'Follow-up', notes: 'Needs more info on senior plans', hasRecording: false },
    { leadId: leadMap['Robert Smith'], leadName: 'Robert Smith', agentName: 'Sarah Johnson', date: ago(0), time: '9:00 AM', duration: '2 min', status: 'Missed', notes: 'Voicemail left', hasRecording: false },
    { leadId: leadMap['Thomas Anderson'], leadName: 'Thomas Anderson', agentName: 'Emily Davis', date: ago(0), time: '10:15 AM', duration: '6 min', status: 'Completed', notes: 'Business insurance inquiry details', hasRecording: true },
  ]);
  console.log(`Created ${calls.length} calls`);

  // --- Notifications ---
  const notifications = await Notification.create([
    { type: 'overdue', title: 'Overdue Follow-up', message: 'Follow-up with David Martinez is 3 days overdue', timestamp: ago(0), read: false, leadId: leadMap['David Martinez'] },
    { type: 'overdue', title: 'Overdue Follow-up', message: 'Follow-up with Christopher Hall is 5 days overdue', timestamp: ago(0), read: false, leadId: leadMap['Christopher Hall'] },
    { type: 'follow-up', title: 'Follow-up Today', message: 'Follow-up with Thomas Anderson is due today', timestamp: ago(0), read: false, leadId: leadMap['Thomas Anderson'] },
    { type: 'overdue', title: 'Overdue Follow-up', message: 'Follow-up with Jennifer Brown is 1 day overdue', timestamp: ago(0), read: false, leadId: leadMap['Jennifer Brown'] },
    { type: 'assignment', title: 'New Lead Assigned', message: 'Robert Smith has been assigned to you', timestamp: ago(0), read: true },
    { type: 'system', title: 'CSV Import Complete', message: '15 leads imported successfully', timestamp: ago(1), read: true },
  ]);
  console.log(`Created ${notifications.length} notifications`);

  console.log('\n✅ Database seeded successfully!');
  console.log('\nDemo accounts:');
  console.log('  Admin: admin@insurelead.com / admin123');
  console.log('  SDR:   mike@insurelead.com  / sdr123');
  console.log('  SDR:   emily@insurelead.com / sdr123');
  console.log('  SDR:   james@insurelead.com / sdr123');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});

import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/common/ProtectedRoute";

// Layouts
import AdminLayout from "@/features/admin/layout/AdminLayout";
import SDRLayout from "@/features/sdr/layout/SDRLayout";
import HRLayout from "@/features/hr/layout/HRLayout";
import LeadGenLayout from "@/features/leadgen/layout/LeadGenLayout";

// Public / Auth pages
import LandingPage from "@/features/auth/pages/LandingPage";
import LoginPage from "@/features/auth/pages/LoginPage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";
import NotFound from "@/pages/NotFound";

// Admin pages
import AdminDashboard from "@/features/admin/pages/AdminDashboard";
import TeamManagement from "@/features/admin/pages/TeamManagement";
import AdminSettings from "@/features/admin/pages/AdminSettings";
import FunnelDashboardPage from "@/features/admin/pages/FunnelDashboardPage";
import HuddlePage from "@/features/admin/pages/HuddlePage";

// SDR pages
import SDRDashboard from "@/features/sdr/pages/SDRDashboard";
import MyLeadsPage from "@/features/sdr/pages/MyLeadsPage";
import MyCallsPage from "@/features/sdr/pages/MyCallsPage";
import MyFollowUpsPage from "@/features/sdr/pages/MyFollowUpsPage";
import SDRPipelinePage from "@/features/sdr/pages/SDRPipelinePage";

// HR pages
import HRDashboard from "@/features/hr/pages/HRDashboard";
import HRLeadTracker from "@/features/hr/pages/HRLeadTracker";
import HRClosedLeads from "@/features/hr/pages/HRClosedLeads";

// Lead Gen pages
import LeadGenDashboard from "@/features/leadgen/pages/LeadGenDashboard";
import LeadGenLeadsPage from "@/features/leadgen/pages/LeadGenLeadsPage";
import LeadGenLinkedIn from "@/features/leadgen/pages/LeadGenLinkedIn";
import LeadGenEmail from "@/features/leadgen/pages/LeadGenEmail";

// Shared feature pages
import NotesPage from "@/features/notes/pages/NotesPage";
import LeadsPage from "@/features/leads/pages/LeadsPage";
import LeadDetailPage from "@/features/leads/pages/LeadDetailPage";
import CSVUploadPage from "@/features/leads/pages/CSVUploadPage";
import CallsPage from "@/features/calls/pages/CallsPage";
import CallDetailPage from "@/features/calls/pages/CallDetailPage";
import FollowUpsPage from "@/features/follow-ups/pages/FollowUpsPage";
import PipelinePage from "@/features/pipeline/pages/PipelinePage";
import AgentKPIsPage from "@/pages/AgentKPIsPage";
import CalendarPage from "@/features/calendar/pages/CalendarPage";
import EmailOutreachPage from "@/features/outreach/pages/EmailOutreachPage";
import LinkedInOutreachPage from "@/features/outreach/pages/LinkedInOutreachPage";
import MeetingsPage from "@/features/meetings/pages/MeetingsPage";

const AppRoutes = () => (
    <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Admin routes */}
        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/huddle" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><HuddlePage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/funnel" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><FunnelDashboardPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/leads" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><LeadsPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/leads/:leadId" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><LeadDetailPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/calls" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><CallsPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/calls/:callId" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><CallDetailPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/follow-ups" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><FollowUpsPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/pipeline" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><PipelinePage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/team" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><TeamManagement /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/calendar" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><CalendarPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/notes" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><NotesPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/meetings" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><MeetingsPage /></AdminLayout></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><AdminSettings /></AdminLayout></ProtectedRoute>} />

        {/* SDR routes */}
        <Route path="/sdr" element={<ProtectedRoute allowedRoles={['sdr']}><SDRLayout><SDRDashboard /></SDRLayout></ProtectedRoute>} />
        <Route path="/sdr/leads" element={<ProtectedRoute allowedRoles={['sdr']}><SDRLayout><MyLeadsPage /></SDRLayout></ProtectedRoute>} />
        <Route path="/sdr/leads/:leadId" element={<ProtectedRoute allowedRoles={['sdr']}><SDRLayout><LeadDetailPage /></SDRLayout></ProtectedRoute>} />
        <Route path="/sdr/calls" element={<ProtectedRoute allowedRoles={['sdr']}><SDRLayout><MyCallsPage /></SDRLayout></ProtectedRoute>} />
        <Route path="/sdr/calls/:callId" element={<ProtectedRoute allowedRoles={['sdr']}><SDRLayout><CallDetailPage /></SDRLayout></ProtectedRoute>} />
        <Route path="/sdr/follow-ups" element={<ProtectedRoute allowedRoles={['sdr']}><SDRLayout><MyFollowUpsPage /></SDRLayout></ProtectedRoute>} />
        <Route path="/sdr/pipeline" element={<ProtectedRoute allowedRoles={['sdr']}><SDRLayout><SDRPipelinePage /></SDRLayout></ProtectedRoute>} />
        <Route path="/sdr/calendar" element={<ProtectedRoute allowedRoles={['sdr']}><SDRLayout><CalendarPage /></SDRLayout></ProtectedRoute>} />
        <Route path="/sdr/meetings" element={<ProtectedRoute allowedRoles={['sdr']}><SDRLayout><MeetingsPage /></SDRLayout></ProtectedRoute>} />
        <Route path="/sdr/email" element={<ProtectedRoute allowedRoles={['sdr']}><SDRLayout><EmailOutreachPage /></SDRLayout></ProtectedRoute>} />
        <Route path="/sdr/linkedin" element={<ProtectedRoute allowedRoles={['sdr']}><SDRLayout><LinkedInOutreachPage /></SDRLayout></ProtectedRoute>} />
        <Route path="/sdr/notes" element={<ProtectedRoute allowedRoles={['sdr']}><SDRLayout><NotesPage /></SDRLayout></ProtectedRoute>} />

        {/* HR routes */}
        <Route path="/hr" element={<ProtectedRoute allowedRoles={['hr']}><HRLayout><HRDashboard /></HRLayout></ProtectedRoute>} />
        <Route path="/hr/leads" element={<ProtectedRoute allowedRoles={['hr']}><HRLayout><HRLeadTracker /></HRLayout></ProtectedRoute>} />
        <Route path="/hr/closed-leads" element={<ProtectedRoute allowedRoles={['hr']}><HRLayout><HRClosedLeads /></HRLayout></ProtectedRoute>} />
        <Route path="/hr/notes" element={<ProtectedRoute allowedRoles={['hr']}><HRLayout><NotesPage /></HRLayout></ProtectedRoute>} />

        {/* Lead Gen routes */}
        <Route path="/leadgen" element={<ProtectedRoute allowedRoles={['leadgen']}><LeadGenLayout><LeadGenDashboard /></LeadGenLayout></ProtectedRoute>} />
        <Route path="/leadgen/leads" element={<ProtectedRoute allowedRoles={['leadgen']}><LeadGenLayout><LeadGenLeadsPage /></LeadGenLayout></ProtectedRoute>} />
        <Route path="/leadgen/upload" element={<ProtectedRoute allowedRoles={['leadgen']}><LeadGenLayout><CSVUploadPage /></LeadGenLayout></ProtectedRoute>} />
        <Route path="/leadgen/linkedin" element={<ProtectedRoute allowedRoles={['leadgen']}><LeadGenLayout><LeadGenLinkedIn /></LeadGenLayout></ProtectedRoute>} />
        <Route path="/leadgen/email" element={<ProtectedRoute allowedRoles={['leadgen']}><LeadGenLayout><LeadGenEmail /></LeadGenLayout></ProtectedRoute>} />
        <Route path="/leadgen/meetings" element={<ProtectedRoute allowedRoles={['leadgen']}><LeadGenLayout><MeetingsPage /></LeadGenLayout></ProtectedRoute>} />
        <Route path="/leadgen/notes" element={<ProtectedRoute allowedRoles={['leadgen']}><LeadGenLayout><NotesPage /></LeadGenLayout></ProtectedRoute>} />

        {/* Legacy dashboard redirect */}
        <Route path="/dashboard/*" element={<Navigate to="/login" replace />} />

        <Route path="*" element={<NotFound />} />
    </Routes>
);

export default AppRoutes;

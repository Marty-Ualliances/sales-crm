import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Public pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import NotFound from "./pages/NotFound";

// Layouts
import AdminLayout from "./components/AdminLayout";
import SDRLayout from "./components/SDRLayout";
import HRLayout from "./components/HRLayout";
import LeadGenLayout from "./components/LeadGenLayout";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import TeamManagement from "./pages/admin/TeamManagement";
import AdminSettings from "./pages/admin/AdminSettings";
import ImpersonatePage from "./pages/admin/ImpersonatePage";

// SDR pages
import SDRDashboard from "./pages/sdr/SDRDashboard";
import MyLeadsPage from "./pages/sdr/MyLeadsPage";
import MyCallsPage from "./pages/sdr/MyCallsPage";
import MyFollowUpsPage from "./pages/sdr/MyFollowUpsPage";
import SDRPipelinePage from "./pages/sdr/SDRPipelinePage";

// HR pages
import HRDashboard from "./pages/hr/HRDashboard";
import HRLeadTracker from "./pages/hr/HRLeadTracker";
import HRClosedLeads from "./pages/hr/HRClosedLeads";

// Lead Gen pages
import LeadGenDashboard from "./pages/leadgen/LeadGenDashboard";
import LeadGenLeadsPage from "./pages/leadgen/LeadGenLeadsPage";
import LeadGenLinkedIn from "./pages/leadgen/LeadGenLinkedIn";
import LeadGenEmail from "./pages/leadgen/LeadGenEmail";

// Notes (shared, private per-user)
import NotesPage from "./pages/NotesPage";

// Shared pages (used in both admin & SDR)
import LeadsPage from "./pages/LeadsPage";
import LeadDetailPage from "./pages/LeadDetailPage";
import CallsPage from "./pages/CallsPage";
import CallDetailPage from "./pages/CallDetailPage";
import FollowUpsPage from "./pages/FollowUpsPage";
import CSVUploadPage from "./pages/CSVUploadPage";
import PipelinePage from "./pages/PipelinePage";
import AgentKPIsPage from "./pages/AgentKPIsPage";
import CalendarPage from "./pages/CalendarPage";
import EmailOutreachPage from "./pages/EmailOutreachPage";
import LinkedInOutreachPage from "./pages/LinkedInOutreachPage";
import MeetingsPage from "./pages/MeetingsPage";
import CallRecordingsPage from "./pages/CallRecordingsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Admin routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/leads" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><LeadsPage /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/leads/:leadId" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><LeadDetailPage /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/calls" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><CallsPage /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/calls/:callId" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><CallDetailPage /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/recordings" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><CallRecordingsPage /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/follow-ups" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><FollowUpsPage /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/pipeline" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><PipelinePage /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/team" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><TeamManagement /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/calendar" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><CalendarPage /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/notes" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><NotesPage /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/meetings" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><MeetingsPage /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/email" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><EmailOutreachPage /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/linkedin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><LinkedInOutreachPage /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/impersonate" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><ImpersonatePage /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><AdminSettings /></AdminLayout></ProtectedRoute>} />

            {/* SDR routes */}
            <Route path="/sdr" element={<ProtectedRoute allowedRoles={['sdr']}><SDRLayout><SDRDashboard /></SDRLayout></ProtectedRoute>} />
            <Route path="/sdr/leads" element={<ProtectedRoute allowedRoles={['sdr']}><SDRLayout><MyLeadsPage /></SDRLayout></ProtectedRoute>} />
            <Route path="/sdr/leads/:leadId" element={<ProtectedRoute allowedRoles={['sdr']}><SDRLayout><LeadDetailPage /></SDRLayout></ProtectedRoute>} />
            <Route path="/sdr/calls" element={<ProtectedRoute allowedRoles={['sdr']}><SDRLayout><MyCallsPage /></SDRLayout></ProtectedRoute>} />
            <Route path="/sdr/calls/:callId" element={<ProtectedRoute allowedRoles={['sdr']}><SDRLayout><CallDetailPage /></SDRLayout></ProtectedRoute>} />
            <Route path="/sdr/recordings" element={<ProtectedRoute allowedRoles={['sdr']}><SDRLayout><CallRecordingsPage /></SDRLayout></ProtectedRoute>} />
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
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

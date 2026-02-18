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

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import TeamManagement from "./pages/admin/TeamManagement";
import AdminSettings from "./pages/admin/AdminSettings";

// SDR pages
import SDRDashboard from "./pages/sdr/SDRDashboard";
import MyLeadsPage from "./pages/sdr/MyLeadsPage";
import MyCallsPage from "./pages/sdr/MyCallsPage";
import MyFollowUpsPage from "./pages/sdr/MyFollowUpsPage";
import SDRPipelinePage from "./pages/sdr/SDRPipelinePage";

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
            <Route path="/admin/follow-ups" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><FollowUpsPage /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/upload" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><CSVUploadPage /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/pipeline" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><PipelinePage /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/kpis" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><AgentKPIsPage /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/team" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><TeamManagement /></AdminLayout></ProtectedRoute>} />
            <Route path="/admin/calendar" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout><CalendarPage /></AdminLayout></ProtectedRoute>} />
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

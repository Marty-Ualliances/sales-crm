import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Calendar, Home, LogOut, StickyNote, Users, Zap, Menu, X, Clock, Phone, Headphones, Layers, Mail, Linkedin, CalendarCheck, Mic
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useApi';
import NotificationDropdown from './NotificationDropdown';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/hooks/useSocket';

const sdrNavItems = [
  { icon: Home, label: 'Dashboard', path: '/sdr' },
  { icon: Users, label: 'My Leads', path: '/sdr/leads' },
  { icon: Phone, label: 'My Calls', path: '/sdr/calls' },
  { icon: Mic, label: 'Call Recordings', path: '/sdr/recordings' },
  { icon: Clock, label: 'My Follow-ups', path: '/sdr/follow-ups' },
  { icon: Layers, label: 'Pipeline', path: '/sdr/pipeline' },
  { icon: Calendar, label: 'Calendar', path: '/sdr/calendar' },
  { icon: CalendarCheck, label: 'Meetings', path: '/sdr/meetings' },
  { icon: Mail, label: 'Email Outreach', path: '/sdr/email' },
  { icon: Linkedin, label: 'LinkedIn Outreach', path: '/sdr/linkedin' },
  { icon: StickyNote, label: 'My Notes', path: '/sdr/notes' },
];

export default function SDRLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: notifications = [] } = useNotifications();
  const unreadCount = notifications.filter((n: any) => !n.read).length;
  useSocket();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-sidebar border-r border-sidebar-border flex flex-col transition-transform lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center gap-2 px-6 border-b border-sidebar-border">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary animate-glow-pulse">
            <Zap className="h-4 w-4 text-primary-foreground animate-float" />
          </div>
          <span className="text-lg font-bold text-sidebar-foreground">TeamUnited</span>
          <button className="ml-auto lg:hidden text-sidebar-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* SDR badge */}
        <div className="px-4 py-3 border-b border-sidebar-border">
          <div className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2">
            <Headphones className="h-4 w-4 text-accent-foreground" />
            <span className="text-sm font-semibold text-accent-foreground">SDR Panel</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {sdrNavItems.map(item => {
            const active = location.pathname === item.path ||
              (item.path !== '/sdr' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${active
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.label === 'My Follow-ups' && (
                  <Badge variant="destructive" className="ml-auto text-xs h-5 px-1.5">3</Badge>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-40 bg-foreground/20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border px-6 bg-card">
          <button className="lg:hidden text-foreground" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <NotificationDropdown notifications={notifications} unreadCount={unreadCount} />
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                {user?.avatar || 'SR'}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-foreground">{user?.name || 'Agent'}</p>
                <p className="text-xs text-muted-foreground">SDR</p>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

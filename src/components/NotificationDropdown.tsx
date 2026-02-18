import { useState, useRef, useEffect } from 'react';
import { Bell, Clock, AlertTriangle, UserPlus, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Notification } from '@/types/leads';

const typeIcons = {
  'follow-up': Clock,
  'overdue': AlertTriangle,
  'assignment': UserPlus,
  'system': Info,
};

export default function NotificationDropdown({ notifications, unreadCount }: { notifications: Notification[]; unreadCount: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background hover:bg-secondary transition-colors"
      >
        <Bell className="h-4 w-4 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium animate-pulse-soft">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-80 rounded-xl border border-border bg-card shadow-elevated z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            <Badge variant="secondary" className="text-xs">{unreadCount} new</Badge>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.map(n => {
              const Icon = typeIcons[n.type];
              return (
                <div key={n.id} className={`flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 ${!n.read ? 'bg-accent/30' : ''}`}>
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${n.type === 'overdue' ? 'bg-destructive/10 text-destructive' : 'bg-accent text-accent-foreground'}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{n.timestamp}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

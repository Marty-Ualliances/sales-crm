import { UserPlus, Phone, CalendarCheck, RefreshCw, FileText, Edit } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  target: string;
  timestamp: string;
  type: 'add' | 'call' | 'meeting' | 'status' | 'note' | 'edit';
}

const iconMap = {
  add: UserPlus,
  call: Phone,
  meeting: CalendarCheck,
  status: RefreshCw,
  note: FileText,
  edit: Edit,
};

const iconColorMap = {
  add: 'bg-primary/10 text-primary',
  call: 'bg-success/10 text-success',
  meeting: 'bg-warning/10 text-warning',
  status: 'bg-accent text-primary',
  note: 'bg-muted text-muted-foreground',
  edit: 'bg-secondary text-secondary-foreground',
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

const now = new Date();
const h = (hours: number) => new Date(now.getTime() - hours * 3600000).toISOString();

const recentActivities: ActivityItem[] = [
  { id: '1', user: 'David Martinez', action: 'added a new lead', target: 'Thomas Anderson', timestamp: h(0.5), type: 'add' },
  { id: '2', user: 'Sarah Johnson', action: 'set up a meeting with', target: 'Robert Smith', timestamp: h(1), type: 'meeting' },
  { id: '3', user: 'Emily Davis', action: 'updated lead status to Contacted for', target: 'Sarah Kim', timestamp: h(2), type: 'status' },
  { id: '4', user: 'Mike Chen', action: 'completed a follow-up call with', target: 'Jennifer Brown', timestamp: h(4), type: 'call' },
  { id: '5', user: 'James Wilson', action: 'added a note to', target: 'William Garcia', timestamp: h(6), type: 'note' },
  { id: '6', user: 'Sarah Johnson', action: 'closed the deal with', target: 'Lisa Thompson', timestamp: h(12), type: 'status' },
  { id: '7', user: 'Emily Davis', action: 'logged a call with', target: 'David Martinez', timestamp: h(18), type: 'call' },
  { id: '8', user: 'Mike Chen', action: 'edited lead details for', target: 'Amanda White', timestamp: h(24), type: 'edit' },
];

export default function RecentActivityFeed() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
        <span className="text-xs text-muted-foreground">Latest updates</span>
      </div>
      <ScrollArea className="h-[320px] px-5 pb-5">
        <div className="space-y-4">
          {recentActivities.map((activity) => {
            const Icon = iconMap[activity.type];
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconColorMap[activity.type]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{activity.user}</span>{' '}
                    {activity.action}{' '}
                    <span className="font-medium">{activity.target}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(activity.timestamp)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

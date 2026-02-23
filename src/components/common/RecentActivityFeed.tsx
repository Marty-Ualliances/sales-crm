import { UserPlus, Phone, CalendarCheck, RefreshCw, FileText, Edit } from 'lucide-react';

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

const iconStyles = {
  add: 'bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-primary/20',
  call: 'bg-gradient-to-br from-success/20 to-success/5 text-success ring-success/20',
  meeting: 'bg-gradient-to-br from-warning/20 to-warning/5 text-warning ring-warning/20',
  status: 'bg-gradient-to-br from-blue-500/20 to-blue-500/5 text-blue-500 ring-blue-500/20',
  note: 'bg-gradient-to-br from-muted-foreground/15 to-muted-foreground/5 text-muted-foreground ring-muted-foreground/15',
  edit: 'bg-gradient-to-br from-violet-500/20 to-violet-500/5 text-violet-500 ring-violet-500/20',
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

const now = new Date();
const h = (hours: number) => new Date(now.getTime() - hours * 3600000).toISOString();

const recentActivities: ActivityItem[] = [
  { id: '1', user: 'David Martinez', action: 'added a new lead', target: 'Thomas Anderson', timestamp: h(0.5), type: 'add' },
  { id: '2', user: 'Sarah Johnson', action: 'set up a meeting with', target: 'Robert Smith', timestamp: h(1), type: 'meeting' },
  { id: '3', user: 'Emily Davis', action: 'updated lead status for', target: 'Sarah Kim', timestamp: h(2), type: 'status' },
  { id: '4', user: 'Mike Chen', action: 'completed a follow-up call with', target: 'Jennifer Brown', timestamp: h(4), type: 'call' },
  { id: '5', user: 'James Wilson', action: 'added a note to', target: 'William Garcia', timestamp: h(6), type: 'note' },
  { id: '6', user: 'Sarah Johnson', action: 'closed the deal with', target: 'Lisa Thompson', timestamp: h(12), type: 'status' },
  { id: '7', user: 'Emily Davis', action: 'logged a call with', target: 'David Martinez', timestamp: h(18), type: 'call' },
  { id: '8', user: 'Mike Chen', action: 'edited lead details for', target: 'Amanda White', timestamp: h(24), type: 'edit' },
];

export default function RecentActivityFeed() {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-gradient-to-r from-card to-secondary/20">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Latest team updates</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <RefreshCw className="h-3.5 w-3.5 text-primary" />
        </div>
      </div>
      <div className="max-h-[360px] overflow-y-auto">
        <div className="px-6 py-4">
          {recentActivities.map((activity, i) => {
            const Icon = iconMap[activity.type];
            const isLast = i === recentActivities.length - 1;
            return (
              <div key={activity.id} className="relative flex gap-4 group">
                {/* Timeline connector */}
                <div className="flex flex-col items-center">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-2 ${iconStyles[activity.type]} transition-all duration-200 group-hover:scale-110 group-hover:ring-3`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {!isLast && (
                    <div className="w-px flex-1 bg-gradient-to-b from-border to-transparent min-h-[20px]" />
                  )}
                </div>

                {/* Content */}
                <div className={`flex-1 min-w-0 ${isLast ? 'pb-0' : 'pb-5'}`}>
                  <p className="text-sm text-foreground leading-relaxed">
                    <span className="font-semibold">{activity.user}</span>{' '}
                    <span className="text-muted-foreground">{activity.action}</span>{' '}
                    <span className="font-semibold">{activity.target}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{timeAgo(activity.timestamp)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

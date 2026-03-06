'use client';
import { UserPlus, Phone, CalendarCheck, RefreshCw, FileText, Edit, Loader2 } from 'lucide-react';
import { useActivityFeed } from '@/features/activities/hooks/useActivities';

const typeMap: Record<string, { icon: any; style: string }> = {
  call: { icon: Phone, style: 'bg-gradient-to-br from-success/20 to-success/5 text-success ring-success/20' },
  meeting: { icon: CalendarCheck, style: 'bg-gradient-to-br from-warning/20 to-warning/5 text-warning ring-warning/20' },
  'stage-change': { icon: RefreshCw, style: 'bg-gradient-to-br from-blue-500/20 to-blue-500/5 text-blue-500 ring-blue-500/20' },
  note: { icon: FileText, style: 'bg-gradient-to-br from-muted-foreground/15 to-muted-foreground/5 text-muted-foreground ring-muted-foreground/15' },
  edit: { icon: Edit, style: 'bg-gradient-to-br from-violet-500/20 to-violet-500/5 text-violet-500 ring-violet-500/20' },
  default: { icon: UserPlus, style: 'bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-primary/20' },
};

function timeAgo(dateStr: string | Date): string {
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

function describeActivity(a: any): { user: string; action: string; target: string } {
  const user = a.userId?.name || 'Someone';
  const lead = a.leadId ? `${a.leadId.firstName || ''} ${a.leadId.lastName || ''}`.trim() : '';

  switch (a.type) {
    case 'call':
      return { user, action: `logged a ${a.callOutcome || 'call'} call with`, target: lead || 'a lead' };
    case 'meeting':
      return { user, action: 'scheduled a meeting with', target: lead || 'a lead' };
    case 'stage-change':
      return { user, action: `moved`, target: `${lead || 'a lead'} to ${a.toStage?.name || 'new stage'}` };
    case 'note':
      return { user, action: 'added a note to', target: lead || 'a lead' };
    default:
      return { user, action: a.description || 'performed an action on', target: lead || '' };
  }
}

export default function RecentActivityFeed() {
  const { data: activities = [], isLoading } = useActivityFeed();

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
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : activities.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            No recent activity yet
          </div>
        ) : (
          <div className="px-6 py-4">
            {activities.slice(0, 10).map((activity: any, i: number) => {
              const { icon: Icon, style } = typeMap[activity.type] || typeMap.default;
              const { user, action, target } = describeActivity(activity);
              const isLast = i === Math.min(activities.length, 10) - 1;
              return (
                <div key={activity._id} className="relative flex gap-4 group">
                  {/* Timeline connector */}
                  <div className="flex flex-col items-center">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-2 ${style} transition-all duration-200 group-hover:scale-110 group-hover:ring-3`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {!isLast && (
                      <div className="w-px flex-1 bg-gradient-to-b from-border to-transparent min-h-[20px]" />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 min-w-0 ${isLast ? 'pb-0' : 'pb-5'}`}>
                    <p className="text-sm text-foreground leading-relaxed">
                      <span className="font-semibold">{user}</span>{' '}
                      <span className="text-muted-foreground">{action}</span>{' '}
                      {target && <span className="font-semibold">{target}</span>}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{timeAgo(activity.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import { LucideIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  variant?: 'default' | 'danger' | 'success';
  subtitle?: string;
  link?: string;
}

export default function KPICard({ title, value, icon: Icon, change, variant = 'default', subtitle, link }: KPICardProps) {
  const navigate = useNavigate();
  const borderClass = variant === 'danger' ? 'border-l-destructive' : variant === 'success' ? 'border-l-success' : 'border-l-primary';
  const glowClass = variant === 'danger'
    ? 'hover:shadow-[0_0_20px_4px_hsl(var(--destructive)/0.15)]'
    : variant === 'success'
    ? 'hover:shadow-[0_0_20px_4px_hsl(var(--success)/0.15)]'
    : 'hover:shadow-[0_0_20px_4px_hsl(var(--primary)/0.15)]';

  return (
    <div
      className={`rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-300 border-l-4 ${borderClass} ${glowClass} hover:-translate-y-1 ${link ? 'cursor-pointer' : ''} group relative overflow-hidden h-full flex flex-col justify-between`}
      onClick={() => link && navigate(link)}
      role={link ? 'button' : undefined}
      tabIndex={link ? 0 : undefined}
      onKeyDown={e => link && e.key === 'Enter' && navigate(link)}
    >
      {/* Subtle shimmer overlay on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-white/5 to-transparent" />

      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${variant === 'danger' ? 'bg-destructive/10 text-destructive' : variant === 'success' ? 'bg-success/10 text-success' : 'bg-primary/15 text-primary'}`}>
          <Icon className="h-5 w-5 group-hover:animate-float" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className={`text-3xl font-bold transition-colors animate-count-up ${variant === 'danger' ? 'text-destructive' : 'text-foreground'}`}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {change && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full animate-scale-in ${change.startsWith('+') ? 'text-success bg-success/10' : 'text-destructive bg-destructive/10'}`}>
            {change}
          </span>
        )}
      </div>
    </div>
  );
}

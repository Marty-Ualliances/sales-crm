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

const VARIANT_STYLES = {
  default: {
    border: 'border-l-primary',
    glow: 'hover:shadow-[0_8px_30px_hsl(var(--primary)/0.12)]',
    iconBg: 'bg-gradient-to-br from-primary/20 to-primary/5',
    iconColor: 'text-primary',
    valueColor: 'text-foreground',
    accentGradient: 'from-primary/5 via-transparent to-transparent',
  },
  danger: {
    border: 'border-l-destructive',
    glow: 'hover:shadow-[0_8px_30px_hsl(var(--destructive)/0.12)]',
    iconBg: 'bg-gradient-to-br from-destructive/20 to-destructive/5',
    iconColor: 'text-destructive',
    valueColor: 'text-destructive',
    accentGradient: 'from-destructive/5 via-transparent to-transparent',
  },
  success: {
    border: 'border-l-success',
    glow: 'hover:shadow-[0_8px_30px_hsl(var(--success)/0.12)]',
    iconBg: 'bg-gradient-to-br from-success/20 to-success/5',
    iconColor: 'text-success',
    valueColor: 'text-foreground',
    accentGradient: 'from-success/5 via-transparent to-transparent',
  },
};

export default function KPICard({ title, value, icon: Icon, change, variant = 'default', subtitle, link }: KPICardProps) {
  const navigate = useNavigate();
  const s = VARIANT_STYLES[variant];

  return (
    <div
      className={`relative rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-300 border-l-4 ${s.border} ${s.glow} hover:-translate-y-1 ${link ? 'cursor-pointer' : ''} group overflow-hidden h-full flex flex-col justify-between`}
      onClick={() => link && navigate(link)}
      role={link ? 'button' : undefined}
      tabIndex={link ? 0 : undefined}
      onKeyDown={e => link && e.key === 'Enter' && navigate(link)}
    >
      {/* Corner gradient accent */}
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${s.accentGradient} rounded-bl-[100%] pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />

      {/* Shimmer sweep on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-r from-transparent via-white/[0.04] to-transparent translate-x-[-100%] group-hover:translate-x-[100%]" style={{ transition: 'opacity 0.7s, transform 1.2s' }} />

      <div className="relative flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.iconBg} transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          <Icon className={`h-5 w-5 ${s.iconColor}`} />
        </div>
      </div>
      <div className="relative flex items-end justify-between">
        <div>
          <p className={`text-3xl font-bold tracking-tight ${s.valueColor} animate-count-up`}>{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        {change && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full animate-scale-in ${change.startsWith('+') ? 'text-success bg-success/10 border border-success/20' : 'text-destructive bg-destructive/10 border border-destructive/20'}`}>
            {change}
          </span>
        )}
      </div>
    </div>
  );
}

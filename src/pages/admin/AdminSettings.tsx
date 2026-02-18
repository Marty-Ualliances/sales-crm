import { Bell, Shield, Users, Key, Database, Mail, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

export default function AdminSettings() {
  const [companyName, setCompanyName] = useState('InsureLead Agency');
  const [notifyOverdue, setNotifyOverdue] = useState(true);
  const [notifyNewLead, setNotifyNewLead] = useState(true);
  const [autoAssign, setAutoAssign] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your workspace and preferences</p>
      </div>

      {/* General */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">General</h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground">Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Timezone</label>
            <select className="mt-1 w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground">
              <option>America/New_York (EST)</option>
              <option>America/Chicago (CST)</option>
              <option>America/Denver (MST)</option>
              <option>America/Los_Angeles (PST)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Bell className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
        </div>
        <div className="space-y-3">
          {[
            { label: 'Overdue follow-up alerts', checked: notifyOverdue, onChange: setNotifyOverdue },
            { label: 'New lead assignment alerts', checked: notifyNewLead, onChange: setNotifyNewLead },
          ].map(item => (
            <label key={item.label} className="flex items-center justify-between py-2">
              <span className="text-sm text-foreground">{item.label}</span>
              <button
                type="button"
                onClick={() => item.onChange(!item.checked)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${item.checked ? 'bg-primary' : 'bg-muted'}`}
              >
                <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${item.checked ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </label>
          ))}
        </div>
      </div>

      {/* Lead Assignment */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Lead Assignment</h2>
        </div>
        <label className="flex items-center justify-between py-2">
          <div>
            <span className="text-sm text-foreground">Auto-assign new leads</span>
            <p className="text-xs text-muted-foreground">Distribute new CSV imports automatically using round-robin</p>
          </div>
          <button
            type="button"
            onClick={() => setAutoAssign(!autoAssign)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoAssign ? 'bg-primary' : 'bg-muted'}`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${autoAssign ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </label>
      </div>

      {/* Security */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Key className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Security</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <span className="text-sm text-foreground">Two-factor authentication</span>
              <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
            </div>
            <Badge variant="secondary">Coming Soon</Badge>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <span className="text-sm text-foreground">Session timeout</span>
              <p className="text-xs text-muted-foreground">Auto-logout after inactivity</p>
            </div>
            <select className="h-8 rounded-md border border-input bg-background px-2 text-sm">
              <option>30 minutes</option>
              <option>1 hour</option>
              <option>4 hours</option>
              <option>Never</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <Button className="gradient-primary border-0 gap-2" onClick={handleSave}>
          <Save className="h-4 w-4" />
          Save Changes
        </Button>
        {saved && <span className="text-sm text-success font-medium">Settings saved!</span>}
      </div>
    </div>
  );
}

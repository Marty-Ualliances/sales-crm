import SDRLayout from '@/features/sdr/layout/SDRLayout';
import ChangePasswordCard from '@/components/common/ChangePasswordCard';
import { Settings } from 'lucide-react';

export default function SDRSettingsPage() {
    return (
        <SDRLayout>
            <div className="space-y-6 max-w-3xl">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage your account preferences</p>
                </div>
                <ChangePasswordCard />
            </div>
        </SDRLayout>
    );
}

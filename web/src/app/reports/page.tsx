import { AdminLayout } from '@/components/AdminLayout';

function Placeholder({ title }: { title: string }) {
  return <AdminLayout><h1 className="text-3xl font-extrabold text-text-primary mb-4">{title}</h1><div className="glass-card p-8 text-text-secondary">Management panel coming soon.</div></AdminLayout>;
}

export default function ReportsPage() { return <Placeholder title="Reports" />; }
export function NotificationsPage() { return <Placeholder title="Notifications" />; }
export function BlogsPage() { return <Placeholder title="Blogs" />; }
export function NewsPage() { return <Placeholder title="News" />; }
export function SettingsPage() { return <Placeholder title="Settings" />; }
export function ApiKeysPage() { return <Placeholder title="API Keys" />; }
export function DynamicLinksPage() { return <Placeholder title="Dynamic Links" />; }
export function WebsiteContentPage() { return <Placeholder title="Website Content" />; }

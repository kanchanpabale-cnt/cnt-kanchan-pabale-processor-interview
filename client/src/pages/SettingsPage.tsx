import { LogOut, Mail, ShieldCheck, UserCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../design-system/Badge';
import { Button } from '../design-system/Button';
import { Card, CardBody } from '../design-system/Card';
import { useAuth } from '../hooks/useAuth';

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-brand-100 py-3 last:border-b-0">
      <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">{label}</p>
        <div className="mt-0.5 text-sm text-ink">{value}</div>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Your account details and session controls.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 px-6 py-8 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 font-display text-2xl font-bold backdrop-blur">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="truncate font-display text-xl font-semibold">
                {user?.name ?? 'Unknown user'}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-sm text-white/80">
                <span className="truncate">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>
        <CardBody>
          <InfoRow icon={UserCircle2} label="Name" value={user?.name ?? '—'} />
          <InfoRow icon={Mail} label="Email" value={user?.email ?? '—'} />
          <InfoRow
            icon={ShieldCheck}
            label="Role"
            value={
              user ? (
                <Badge tone={user.role === 'ADMIN' ? 'brand' : 'neutral'}>{user.role}</Badge>
              ) : (
                '—'
              )
            }
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold text-ink">End session</h2>
            <p className="mt-1 text-sm text-ink-muted">
              You'll be returned to the login screen. The token is cleared locally.
            </p>
          </div>
          <Button variant="danger" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}

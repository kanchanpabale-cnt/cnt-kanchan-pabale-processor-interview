import { Link } from "react-router-dom";
import { Shield, User as UserIcon } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

export function TopBar() {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-brand-100 bg-surface px-6 py-3 shadow-sm">
      {user && (
        <Link
          to="/settings"
          className="group flex items-center gap-2 rounded-full px-2 py-1 text-sm transition hover:bg-brand-50"
          aria-label="Open settings"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-900 group-hover:bg-brand-200">
            {user.role === "ADMIN" ? (
              <Shield className="h-4 w-4" />
            ) : (
              <UserIcon className="h-4 w-4" />
            )}
          </div>
          <div className="hidden leading-tight sm:block">
            <div className="font-medium text-ink">{user.name}</div>
            <div className="text-xs text-ink-muted">{user.email}</div>
          </div>
        </Link>
      )}
    </header>
  );
}

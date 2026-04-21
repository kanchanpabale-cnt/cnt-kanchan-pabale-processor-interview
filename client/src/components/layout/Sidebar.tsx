import { NavLink } from 'react-router-dom';
import { LayoutDashboard, LineChart, Receipt, Settings } from 'lucide-react';
import clsx from 'clsx';
import { SignaPayLogo } from '../../design-system/SignaPayLogo';

const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Cards & Transactions', icon: Receipt },
  { to: '/reports', label: 'Reports', icon: LineChart },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 flex-shrink-0 bg-brand-900 p-5 md:flex md:flex-col">
      <SignaPayLogo dark size="sm" className="mb-8" />
      <nav className="flex flex-col gap-1">
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-[8px] px-3 py-2 text-sm font-medium transition',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-brand-200 hover:bg-white/5 hover:text-white',
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto pt-6 text-xs text-brand-200">
        Built for SignaPay · v1.0
      </div>
    </aside>
  );
}

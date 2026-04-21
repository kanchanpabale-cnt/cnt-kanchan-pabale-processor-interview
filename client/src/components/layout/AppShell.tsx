import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { Toaster } from '../../design-system/Toast';

export function AppShell() {
  return (
    <div className="flex h-screen w-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-auto bg-canvas p-6">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
}

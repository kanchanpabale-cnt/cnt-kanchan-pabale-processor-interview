import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { CardsTransactionsPage } from '../pages/CardsTransactionsPage';
import { CardFormPage } from '../pages/CardFormPage';
import { ReportsPage } from '../pages/ReportsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { RequireAuth, RequireRole } from './guards';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'transactions', element: <CardsTransactionsPage /> },
      { path: 'cards', element: <Navigate to="/transactions" replace /> },
      {
        path: 'cards/:id/edit',
        element: (
          <RequireRole role="ADMIN">
            <CardFormPage mode="edit" />
          </RequireRole>
        ),
      },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);

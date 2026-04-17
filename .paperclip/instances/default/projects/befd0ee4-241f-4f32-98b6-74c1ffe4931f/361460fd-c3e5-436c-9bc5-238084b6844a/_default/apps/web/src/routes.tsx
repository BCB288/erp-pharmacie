import { createBrowserRouter } from 'react-router-dom'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { LoginPage } from './features/auth/LoginPage'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { InventoryPage } from './features/inventory/InventoryPage'
import { PosPage } from './features/pos/PosPage'
import { SuppliersPage } from './features/suppliers/SuppliersPage'
import { PatientsPage } from './features/patients/PatientsPage'
import { ReportsPage } from './features/reports/ReportsPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'inventory', element: <InventoryPage /> },
      { path: 'pos', element: <PosPage /> },
      { path: 'suppliers', element: <SuppliersPage /> },
      { path: 'patients', element: <PatientsPage /> },
      { path: 'reports', element: <ReportsPage /> },
    ],
  },
])

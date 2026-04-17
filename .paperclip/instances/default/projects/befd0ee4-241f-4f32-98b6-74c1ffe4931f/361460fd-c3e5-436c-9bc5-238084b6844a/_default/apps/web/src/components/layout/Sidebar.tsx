import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Tableau de bord', icon: '📊' },
  { to: '/inventory', label: 'Inventaire', icon: '💊' },
  { to: '/pos', label: 'Point de vente', icon: '🛒' },
  { to: '/suppliers', label: 'Fournisseurs', icon: '🏭' },
  { to: '/patients', label: 'Patients', icon: '🧑‍⚕️' },
  { to: '/reports', label: 'Rapports', icon: '📈' },
]

export function Sidebar() {
  return (
    <aside className="flex h-full w-60 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <span className="text-lg font-bold text-blue-600">ERP Pharmacie</span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

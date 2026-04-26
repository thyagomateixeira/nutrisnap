import { Outlet, NavLink } from 'react-router-dom'

const navItems = [
  { to: '/',         icon: '🏠', label: 'Início'   },
  { to: '/analyze',  icon: '📷', label: 'Analisar' },
  { to: '/calendar', icon: '📅', label: 'Histórico'},
  { to: '/profile',  icon: '👤', label: 'Perfil'   },
]

export default function Layout() {
  return (
    <div className="flex flex-col min-h-dvh bg-slate-50">
      {/* Conteúdo principal */}
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      {/* Navbar inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-bottom z-50">
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
                  isActive
                    ? 'text-primary-600'
                    : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              <span className="text-2xl">{icon}</span>
              <span className="text-[10px] font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

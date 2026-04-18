import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Truck, Users, ClipboardList, Route,
  Wrench, FileText, CreditCard, Phone, Settings, LogOut,
  Menu, X, Bell,
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/fleet', icon: Truck, label: 'Gestión de Flota' },
  { to: '/drivers', icon: Users, label: 'Gestión de Choferes' },
  { to: '/dispatch', icon: ClipboardList, label: 'Administrativo' },
  { to: '/trips', icon: Route, label: 'Viajes' },
  { to: '/maintenance', icon: Wrench, label: 'Mantenimiento' },
  { to: '/insurance', icon: FileText, label: 'Seguros' },
  { to: '/credit-cards', icon: CreditCard, label: 'Tarjetas de Crédito' },
];

function SidebarContent({ onNav }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-red-600 flex items-center justify-center">
        <img
          src="/logo.png"
          alt="Chaires Trucking"
          className="h-28 w-auto object-contain rounded-lg"
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNav}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-red-900 text-white shadow-sm'
                  : 'text-red-100 hover:bg-red-600 hover:text-white'
              }`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-red-600 space-y-3">
        <div className="flex items-center gap-2 text-red-200 text-xs">
          <Phone className="w-3.5 h-3.5" />
          <span>+52 331 615 5758</span>
        </div>
        <div className="bg-red-800 rounded-lg px-3 py-2">
          <div className="text-white text-sm font-semibold">{user?.nombre}</div>
          <div className="text-red-300 text-xs capitalize">{user?.role}</div>
        </div>
        <div className="flex gap-2">
          <NavLink
            to="/settings"
            onClick={onNav}
            className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-800 rounded-lg px-2 py-1.5 text-xs text-white transition-colors"
          >
            <Settings className="w-3 h-3" />
            Configuración
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-800 rounded-lg px-2 py-1.5 text-xs text-white transition-colors"
          >
            <LogOut className="w-3 h-3" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Layout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-red-700 text-white flex-shrink-0 flex flex-col transform transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="lg:hidden flex justify-end p-3">
          <button onClick={() => setOpen(false)} className="text-red-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent onNav={() => setOpen(false)} />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div className="lg:hidden bg-red-700 text-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button onClick={() => setOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <img src="/logo.png" alt="Chaires Trucking" className="h-8 w-auto object-contain rounded" />
        </div>

        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

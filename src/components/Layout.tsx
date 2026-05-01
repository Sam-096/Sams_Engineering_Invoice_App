import { Outlet, NavLink } from 'react-router-dom';
import { FileText, File, Truck, LayoutGrid, LogOut } from 'lucide-react';
import type { ComponentType } from 'react';
import { useAuth } from '../hooks/useAuth';

interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  end: boolean;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/invoice', label: 'Tax Invoice', icon: FileText, end: false },
  { to: '/proforma', label: 'Proforma', icon: File, end: false },
  { to: '/challan', label: 'Delivery Challan', icon: Truck, end: false },
];

export function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

function Sidebar() {
  const { logout, session } = useAuth();
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__brand-sup">System</div>
        <div className="sidebar__brand-name">SAMS<br />Engineering</div>
      </div>

      <nav className="sidebar__nav">
        <div className="sidebar__nav-group">Navigation</div>
        {navItems.map((item) => <SidebarLink key={item.to} {...item} />)}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__footer-row">
          <span>{session?.username ?? 'guest'}</span>
          <button
            type="button"
            className="sidebar__logout"
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={12} />
            Logout
          </button>
        </div>
        <div className="sidebar__footer-version">v1.0.0</div>
      </div>
    </aside>
  );
}

function SidebarLink({ to, label, icon: Icon, end }: NavItem) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `sidebar__nav-item${isActive ? ' sidebar__nav-item--active' : ''}`
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={14} strokeWidth={isActive ? 2.5 : 1.75} />
          {label}
        </>
      )}
    </NavLink>
  );
}

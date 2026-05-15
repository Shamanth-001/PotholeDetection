import { Link, useLocation } from 'react-router-dom';
import { useAuthStore, useReportStore } from '../../store';
import {
  LayoutDashboard, Map, PlusCircle, Trophy, User,
  HelpCircle, Settings, Building2, Plus
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuthStore();
  const { openSubmitModal } = useReportStore();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const mainLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/map', label: 'Map View', icon: Map },
    { to: '/report', label: 'Report Issue', icon: PlusCircle },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '/profile', label: 'My Profile', icon: User },
  ];

  // Admin gets extra link
  if (user?.role === 'admin') {
    mainLinks.push({ to: '/admin', label: 'Admin Panel', icon: Settings });
  }

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-60 bg-white border-r border-gray-200 z-40 flex flex-col">
      {/* Portal Identity */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gov-900 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">BBMP Portal</div>
            <div className="text-xs text-gray-500">Citizen Services</div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {mainLinks.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to}
            className={isActive(to) ? 'sidebar-link-active' : 'sidebar-link'}>
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}

        {/* New Report button — matching screenshot */}
        <div className="pt-3">
          <button onClick={openSubmitModal}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gov-900 text-white text-sm font-semibold rounded-lg hover:bg-gov-800 transition-colors">
            <Plus className="w-5 h-5" />
            New Report
          </button>
        </div>
      </nav>

      {/* Bottom links */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-1">
        <button className="sidebar-link w-full text-left">
          <HelpCircle className="w-5 h-5" />
          Help & Support
        </button>
        <button className="sidebar-link w-full text-left">
          <Settings className="w-5 h-5" />
          Settings
        </button>
      </div>
    </aside>
  );
}

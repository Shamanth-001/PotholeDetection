import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore, useReportStore, useUIStore } from '../../store';
import {
  LayoutDashboard, Map, PlusCircle, Trophy, User, Users,
  HelpCircle, Settings, Building2, Plus
} from 'lucide-react';
import { HelpModal, SettingsModal } from './SidebarModals';

export default function Sidebar() {
  const { user } = useAuthStore();
  const { openSubmitModal } = useReportStore();
  const { language } = useUIStore();
  const location = useLocation();
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const isActive = (path) => location.pathname === path;


  const labels = {
    dashboard: language === 'en' ? 'Dashboard' : 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    map: language === 'en' ? 'Map View' : 'ನಕ್ಷೆ ವೀಕ್ಷಣೆ',
    report: language === 'en' ? 'Report Issue' : 'ದೂರು ನೀಡಿ',
    leaderboard: language === 'en' ? 'Leaderboard' : 'ಲೀಡರ್‌ಬೋರ್ಡ್',
    profile: language === 'en' ? 'My Profile' : 'ನನ್ನ ಪ್ರೊಫೈಲ್',
    volunteer: language === 'en' ? 'Volunteer Hub' : 'ಸ್ವಯಂಸೇವಕ ಕೇಂದ್ರ',
    admin: language === 'en' ? 'Admin Panel' : 'ನಿರ್ವಾಹಕ ಫಲಕ',
    newReport: language === 'en' ? 'New Report' : 'ಹೊಸ ದೂರು',
    help: language === 'en' ? 'Help & Support' : 'ಸಹಾಯ ಮತ್ತು ಬೆಂಬಲ',
    settings: language === 'en' ? 'Settings' : 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    portal: language === 'en' ? 'BBMP Portal' : 'ಬಿಬಿಎಂಪಿ ಪೋರ್ಟಲ್',
    citizenServices: language === 'en' ? 'Citizen Services' : 'ನಾಗರಿಕ ಸೇವೆಗಳು',
  };

  const mainLinks = [
    { to: '/dashboard', label: labels.dashboard, icon: LayoutDashboard },
    { to: '/map', label: labels.map, icon: Map },
    { to: '/report', label: labels.report, icon: PlusCircle },
    { to: '/leaderboard', label: labels.leaderboard, icon: Trophy },
    { to: '/volunteer', label: labels.volunteer, icon: Users },
    { to: '/profile', label: labels.profile, icon: User },
  ];

  if (user?.role === 'admin') {
    mainLinks.push({ to: '/admin', label: labels.admin, icon: Settings });
  }

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-60 bg-white border-r border-gray-200 z-40 flex flex-col">
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gov-900 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">{labels.portal}</div>
            <div className="text-xs text-gray-500">{labels.citizenServices}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {mainLinks.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to}
            className={isActive(to) ? 'sidebar-link-active' : 'sidebar-link'}>
            <Icon className="w-5 h-5" />
            {label}
          </Link>
        ))}

        <div className="pt-3">
          <button onClick={openSubmitModal}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gov-900 text-white text-sm font-semibold rounded-lg hover:bg-gov-800 transition-colors">
            <Plus className="w-5 h-5" />
            {labels.newReport}
          </button>
        </div>
      </nav>

      <div className="px-3 py-4 border-t border-gray-100 space-y-1">
        <button onClick={() => setShowHelp(true)} className="sidebar-link w-full text-left">
          <HelpCircle className="w-5 h-5" />
          {labels.help}
        </button>
        <button onClick={() => setShowSettings(true)} className="sidebar-link w-full text-left">
          <Settings className="w-5 h-5" />
          {labels.settings}
        </button>
      </div>

      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </aside>
  );
}


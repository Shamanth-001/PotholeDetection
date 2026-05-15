import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { Bell, Globe, User, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Brand */}
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="text-xl font-bold text-gov-900">Namma Bengaluru Clean</span>
        </Link>

        {/* Right side icons */}
        <div className="flex items-center gap-2">
          {/* Language */}
          <button className="p-2 text-gray-500 hover:text-gov-900 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium">
            ಕನ್ನಡ
          </button>

          <button className="p-2 text-gray-500 hover:text-gov-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Globe className="w-5 h-5" />
          </button>

          <button className="p-2 text-gray-500 hover:text-gov-900 hover:bg-gray-100 rounded-lg transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <Link to="/profile" className="p-2 text-gray-500 hover:text-gov-900 hover:bg-gray-100 rounded-lg transition-colors">
            <User className="w-5 h-5" />
          </Link>

          <button onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-1"
            title="Logout">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}

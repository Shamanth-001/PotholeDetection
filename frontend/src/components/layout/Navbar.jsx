import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, useUIStore, useNotificationStore } from '../../store';
import { Bell, Globe, User, LogOut, Mail, Phone, ShieldCheck, Info, Star } from 'lucide-react';

export default function Navbar() {
  const { logout } = useAuthStore();
  const { language, setLanguage } = useUIStore();
  const { notifications, markAllRead } = useNotificationStore();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLegal, setShowLegal] = useState(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => { logout(); navigate('/'); };
  const toggleLanguage = () => setLanguage(language === 'en' ? 'kn' : 'en');

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) markAllRead();
  };

  const LegalModal = ({ title, content, onClose }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gov-900 text-white">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white">✕</button>
        </div>
        <div className="p-8 max-h-[60vh] overflow-y-auto text-gray-600 leading-relaxed text-sm text-left">
          {content}
        </div>
        <div className="p-4 bg-gray-50 text-right border-t border-gray-100">
          <button onClick={onClose} className="px-6 py-2 bg-gov-900 text-white rounded-lg font-bold">Close</button>
        </div>
      </div>
    </div>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Brand & Quick Links */}
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-xl font-black text-gov-900 tracking-tight">
              {language === 'en' ? 'Namma Clean Bengaluru' : 'ನಮ್ಮ ಕ್ಲೀನ್ ಬೆಂಗಳೂರು'}
            </span>
          </Link>
        </div>
        
        {/* Right side icons */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button 
            onClick={toggleLanguage}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 ${
              language === 'kn' 
                ? 'bg-gov-100 text-gov-700 font-bold border border-gov-200 shadow-sm' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Globe className={`w-4 h-4 ${language === 'kn' ? 'text-gov-600 animate-pulse' : ''}`} />
            <span className="text-sm">{language === 'en' ? 'English' : 'ಕನ್ನಡ'}</span>
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button 
              onClick={handleBellClick}
              className={`p-2 rounded-lg transition-all duration-300 ${showNotifications ? 'bg-gov-50 text-gov-900 shadow-inner' : 'text-gray-500 hover:text-gov-900 hover:bg-gray-100'}`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-bounce"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900">{language === 'en' ? 'Notifications' : 'ಅಧಿಸೂಚನೆಗಳು'}</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? notifications.map(n => (
                    <div key={n.id} className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group ${!n.read ? 'bg-gov-50/30' : ''}`}>
                      <div className="flex gap-3 text-left">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          n.type === 'success' ? 'bg-green-100 text-green-600' : 
                          n.type === 'reward' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          {n.type === 'success' ? <ShieldCheck className="w-4 h-4" /> : 
                           n.type === 'reward' ? <Star className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900 group-hover:text-gov-900">{n.title}</div>
                          <div className="text-xs text-gray-500 line-clamp-2 mt-0.5">{n.desc}</div>
                          <div className="text-[10px] font-medium text-gray-400 mt-2">{n.time}</div>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-8 text-center text-gray-400 text-sm italic">
                      {language === 'en' ? 'No notifications yet.' : 'ಇನ್ನೂ ಯಾವುದೇ ಅಧಿಸೂಚನೆಗಳಿಲ್ಲ.'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

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

      {/* Shared Legal Modals */}
      {showLegal === 'Privacy Policy' && (
        <LegalModal title="Privacy Policy" onClose={() => setShowLegal(null)} content={
          <div className="space-y-4">
            <p className="font-bold text-gov-900">Your privacy is paramount.</p>
            <p>Namma Clean Bengaluru collects only the data necessary to verify and address urban infrastructure issues.</p>
            <div className="p-4 bg-gray-50 rounded-xl space-y-2">
              <p><strong>Location Data:</strong> We access your GPS coordinates ONLY when you submit a report.</p>
              <p><strong>Photos:</strong> AI analyzes images for civic issues only.</p>
            </div>
            <p>We do not share personal data with advertisers or 3rd party marketers.</p>
          </div>
        } />
      )}

      {showLegal === 'Terms of Service' && (
        <LegalModal title="Terms of Service" onClose={() => setShowLegal(null)} content={
          <div className="space-y-4 text-left">
            <p>By using this platform, you agree to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li className="font-medium text-gray-900">Provide accurate, real-world photos of civic issues.</li>
              <li>Not upload offensive, illegal, or non-civic related content.</li>
              <li>Respect the community upvoting system.</li>
            </ul>
          </div>
        } />
      )}

      {showLegal === 'Contact Us' && (
        <LegalModal title="Contact Us" onClose={() => setShowLegal(null)} content={
          <div className="space-y-6 text-center">
            <div className="p-6 bg-gov-50 rounded-2xl flex flex-col items-center border border-gov-100">
              <Mail className="w-10 h-10 text-gov-900 mb-4" />
              <div className="font-black text-lg">support.cleanblr@bbmp.gov.in</div>
              <div className="text-[10px] font-black text-gov-600 mt-1 uppercase tracking-widest">Official Support Email</div>
            </div>
            <div className="p-6 bg-amber-50 rounded-2xl flex flex-col items-center border border-amber-100">
              <Phone className="w-10 h-10 text-amber-600 mb-4" />
              <div className="font-black text-2xl">1533</div>
              <div className="text-[10px] font-black text-amber-600 mt-1 uppercase tracking-widest">24/7 Citizen Helpline</div>
            </div>
          </div>
        } />
      )}
    </nav>
  );
}

import { useState, useEffect } from 'react';
import api from '../services/api';
import { Trophy, Award, TrendingUp, Users, MapPin, Star, Shield, Zap, Crown } from 'lucide-react';
import { useUIStore } from '../store';

const REPUTATION_TIERS = [
  { min: 10000, label_en: 'LEGENDARY', label_kn: 'ಲೆಜೆಂಡರಿ', color: 'bg-amber-500 text-white', textColor: 'text-amber-600' },
  { min: 5000, label_en: 'VETERAN', label_kn: 'ಪರಿಣತ', color: 'bg-blue-600 text-white', textColor: 'text-blue-600' },
  { min: 2000, label_en: 'ELITE', label_kn: 'ಎಲೈಟ್', color: 'bg-green-600 text-white', textColor: 'text-green-600' },
  { min: 500, label_en: 'EXPERT', label_kn: 'ತಜ್ಞ', color: 'bg-gray-500 text-white', textColor: 'text-gray-500' },
  { min: 100, label_en: 'ACTIVE', label_kn: 'ಸಕ್ರಿಯ', color: 'bg-gray-400 text-white', textColor: 'text-gray-400' },
  { min: 0, label_en: 'NEWCOMER', label_kn: 'ಹೊಸಬ', color: 'bg-gray-300 text-gray-700', textColor: 'text-gray-400' },
];

function getReputation(points) {
  return REPUTATION_TIERS.find(t => points >= t.min) || REPUTATION_TIERS[REPUTATION_TIERS.length - 1];
}

function getBadges(user, lang) {
  const badges = [];
  if (user.reports_submitted >= 100) badges.push({ icon: '🏆', title: lang === 'en' ? 'Centurion' : 'ಶತಕವೀರ' });
  if (user.reports_submitted >= 50) badges.push({ icon: '✨', title: lang === 'en' ? 'Star Reporter' : 'ಸ್ಟಾರ್ ವರದಿಗಾರ' });
  if (user.certificates_earned >= 3) badges.push({ icon: '🎖️', title: lang === 'en' ? 'Certified' : 'ಪ್ರಮಾಣೀಕೃತ' });
  if (parseFloat(user.volunteer_hours || 0) >= 10) badges.push({ icon: '🤝', title: lang === 'en' ? 'Volunteer' : 'ಸ್ವಯಂಸೇವಕ' });
  return badges;
}

// Ward names for Bangalore areas
const WARDS_EN = ['Jayanagar Ward', 'Malleshwaram Ward', 'Koramangala Ward', 'Whitefield', 'HSR Layout',
  'Indiranagar', 'BTM Layout', 'JP Nagar', 'Basavanagudi', 'Rajajinagar'];

const WARDS_KN = ['ಜಯನಗರ ವಾರ್ಡ್', 'ಮಲ್ಲೇಶ್ವರಂ ವಾರ್ಡ್', 'ಕೋರಮಂಗಲ ವಾರ್ಡ್', 'ವೈಟ್‌ಫೀಲ್ಡ್', 'ಎಚ್‌ಎಸ್‌ಆರ್ ಲೇಔಟ್',
  'ಇಂದಿರಾನಗರ', 'ಬಿಟಿಎಂ ಲೇಔಟ್', 'ಜೆಪಿ ನಗರ', 'ಬಸವನಗುಡಿ', 'ರಾಜಾಜಿನಗರ'];

export default function Leaderboard() {
  const { language } = useUIStore();
  const [leaderboard, setLeaderboard] = useState([]);
  const [highlights, setHighlights] = useState(null);
  const [timeFilter, setTimeFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const labels = {
    totalReports: language === 'en' ? 'Total Reports' : 'ಒಟ್ಟು ವರದಿಗಳು',
    aiVerified: language === 'en' ? 'AI Verified' : 'AI ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
    resolved: language === 'en' ? 'Resolved' : 'ಪರಿಹರಿಸಲಾಗಿದೆ',
    activeCitizens: language === 'en' ? 'Active Citizens' : 'ಸಕ್ರಿಯ ನಾಗರಿಕರು',
    citizenOfMonth: language === 'en' ? 'Citizen of the Month' : 'ಈ ತಿಂಗಳ ನಾಗರಿಕ',
    cleanestWard: language === 'en' ? 'Cleanest Ward' : 'ಅತ್ಯಂತ ಸ್ವಚ್ಛ ವಾರ್ಡ್',
    communityHero: language === 'en' ? 'Community Hero' : 'ಸಮುದಾಯದ ಹೀರೋ',
    issuesResolved: language === 'en' ? 'Issues Resolved' : 'ಸಮಸ್ಯೆಗಳು ಪರಿಹರಿಸಲ್ಪಟ್ಟಿವೆ',
    thisWeek: language === 'en' ? 'this week' : 'ಈ ವಾರ',
    resolutionRate: language === 'en' ? 'Resolution Rate' : 'ಪರಿಹಾರ ದರ',
    wardRank: language === 'en' ? 'Ward Rank' : 'ವಾರ್ಡ್ ಶ್ರೇಣಿ',
    communityPoints: language === 'en' ? 'Community Points' : 'ಸಮುದಾಯದ ಪಾಯಿಂಟ್ಸ್',
    activeSince: language === 'en' ? 'Active since' : 'ಇಂದಿನಿಂದ ಸಕ್ರಿಯ',
    overallImpact: language === 'en' ? 'Overall Impact Points' : 'ಒಟ್ಟಾರೆ ಪ್ರಭಾವದ ಪಾಯಿಂಟ್ಸ್',
    thisMonth: language === 'en' ? 'This Month' : 'ಈ ತಿಂಗಳು',
    allTime: language === 'en' ? 'All Time' : 'ಎಲ್ಲಾ ಸಮಯ',
    rank: language === 'en' ? 'Rank' : 'ಶ್ರೇಣಿ',
    citizen: language === 'en' ? 'Citizen' : 'ನಾಗರಿಕ',
    impactPoints: language === 'en' ? 'Impact Points' : 'ಪ್ರಭಾವದ ಪಾಯಿಂಟ್ಸ್',
    reputation: language === 'en' ? 'Reputation' : 'ಪ್ರತಿಷ್ಠೆ',
    badges: language === 'en' ? 'Badges' : 'ಬ್ಯಾಡ್ಜ್‌ಗಳು',
    viewFull: language === 'en' ? 'View Full Leaderboard' : 'ಪೂರ್ಣ ಲೀಡರ್‌ಬೋರ್ಡ್ ವೀಕ್ಷಿಸಿ',
    legendary: language === 'en' ? 'Legendary Citizen' : 'ಲೆಜೆಂಡರಿ ನಾಗರಿಕ',
    achievements: language === 'en' ? 'Achievements' : 'ಸಾಧನೆಗಳು',
    wardInsight: language === 'en' ? 'Ward Insight' : 'ವಾರ್ಡ್ ಒಳನೋಟ',
    verifiedGroup: language === 'en' ? 'Verified Volunteer Group' : 'ಪರಿಶೀಲಿಸಿದ ಸ್ವಯಂಸೇವಕ ಗುಂಪು',
    members: language === 'en' ? 'Members' : 'ಸದಸ್ಯರು',
    hoursVolunteered: language === 'en' ? 'Hours Volunteered' : 'ಸ್ವಯಂಸೇವೆಯ ಸಮಯ',
    drivesOrganized: language === 'en' ? 'Drives Organized' : 'ಸಂಘಟಿತ ಡ್ರೈವ್‌ಗಳು',
    points: language === 'en' ? 'Points' : 'ಪಾಯಿಂಟ್ಸ್',
    reports: language === 'en' ? 'Reports' : 'ವರದಿಗಳು',
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get('/public/leaderboard');
        if (res.data?.data) {
          setLeaderboard(res.data.data.leaderboard || []);
          setHighlights(res.data.data.highlights || null);
        }
      } catch (err) { console.error('Leaderboard fetch:', err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const WARDS = language === 'en' ? WARDS_EN : WARDS_KN;

  // Generate display data — if no real users, show demo placeholders
  const displayData = leaderboard.length > 0
    ? leaderboard.map((u, i) => ({ ...u, ward: WARDS[i % WARDS.length] }))
    : [
        { id: 1, display_name: 'Ramesh K.', points: 2450, reports_submitted: 10, certificates_earned: 2, volunteer_hours: 12, ward: WARDS[5 % WARDS.length] },
        { id: 2, display_name: 'Anjali M.', points: 2120, reports_submitted: 8, certificates_earned: 1, volunteer_hours: 8, ward: WARDS[1 % WARDS.length] },
        { id: 3, display_name: 'Vikram S.', points: 1980, reports_submitted: 7, certificates_earned: 1, volunteer_hours: 10, ward: WARDS[2 % WARDS.length] },
        { id: 4, display_name: 'Priya Sharma', points: 1540, reports_submitted: 5, certificates_earned: 1, volunteer_hours: 4, ward: WARDS[0 % WARDS.length] },
        { id: 5, display_name: 'Rahul Hegde', points: 1220, reports_submitted: 4, certificates_earned: 0, volunteer_hours: 6, ward: WARDS[4 % WARDS.length] },
      ];

  const [showRameshModal, setShowRameshModal] = useState(false);
  const [showWardModal, setShowWardModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  const topReporterName = 'Citizen Ramesh';
  const topReporterCount = 156;

  return (
    <div className="p-6 lg:p-8">
      {/* Stats Row — Same as Dashboard for consistency */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="gov-card p-5">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{labels.totalReports}</div>
          <div className="text-3xl font-black text-gray-900">2,450+</div>
        </div>
        <div className="gov-card p-5">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{labels.aiVerified}</div>
          <div className="text-3xl font-black text-gov-700">1,890+</div>
        </div>
        <div className="gov-card p-5">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{labels.resolved}</div>
          <div className="text-3xl font-black text-blue-600">1,520+</div>
        </div>
        <div className="gov-card p-5">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{labels.activeCitizens}</div>
          <div className="text-3xl font-black text-amber-600">8,300+</div>
        </div>
      </div>

      {/* Highlight Cards — 3 across */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {/* Top Reporter */}
        <div onClick={() => setShowRameshModal(true)} className="gov-card p-5 gov-card-hover cursor-pointer border-t-4 border-t-amber-400 group">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3 group-hover:bg-amber-100 transition-colors">
              <Crown className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{labels.citizenOfMonth}</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900">{language === 'en' ? 'Citizen Ramesh' : 'ನಾಗರಿಕ ರಮೇಶ್'}</h3>
          <p className="text-sm text-gray-500">{topReporterCount} {labels.issuesResolved}</p>
          <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +12 {labels.thisWeek}
          </p>
        </div>

        {/* Cleanest Ward */}
        <div onClick={() => setShowWardModal(true)} className="gov-card p-5 gov-card-hover cursor-pointer border-t-4 border-t-gov-600 group">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-gov-50 flex items-center justify-center mb-3 group-hover:bg-gov-100 transition-colors">
              <MapPin className="w-5 h-5 text-gov-700" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{labels.cleanestWard}</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900">{language === 'en' ? 'Indiranagar' : 'ಇಂದಿರಾನಗರ'}</h3>
          <p className="text-sm text-gray-500">98% {labels.resolutionRate}</p>
          <p className="text-xs text-gov-700 font-medium mt-2 flex items-center gap-1">
            <Award className="w-3 h-3" /> {labels.wardRank}: #1
          </p>
        </div>

        {/* Community Hero */}
        <div onClick={() => setShowGroupModal(true)} className="gov-card p-5 gov-card-hover cursor-pointer border-t-4 border-t-blue-600 group">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{labels.communityHero}</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900">{language === 'en' ? 'Lalbagh Friends' : 'ಲಾಲ್‌ಬಾಗ್ ಫ್ರೆಂಡ್ಸ್'}</h3>
          <p className="text-sm text-gray-500">2.4k {labels.communityPoints}</p>
          <p className="text-xs text-blue-600 font-medium mt-2 flex items-center gap-1">
            <Star className="w-3 h-3" /> {labels.activeSince} 2021
          </p>
        </div>
      </div>

      {/* Ramesh Profile Modal */}
      {showRameshModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 bg-amber-500 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-xl font-black">R</div>
                <div>
                  <h2 className="text-xl font-bold">{language === 'en' ? 'Ramesh Kumar' : 'ರಮೇಶ್ ಕುಮಾರ್'}</h2>
                  <div className="text-[10px] font-black text-amber-100 uppercase tracking-widest">{labels.legendary}</div>
                </div>
              </div>
              <button onClick={() => setShowRameshModal(false)} className="p-2 hover:bg-white/10 rounded-xl">✕</button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-xl font-black text-gray-900">156</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">{labels.reports}</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-black text-gray-900">12.4k</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">{labels.points}</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-black text-gray-900">5</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase">{labels.badges}</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{labels.achievements}</div>
                <div className="flex gap-2">
                  <span title={language === 'en' ? 'Centurion' : 'ಶತಕವೀರ'} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl cursor-help">🏆</span>
                  <span title={language === 'en' ? 'Star Reporter' : 'ಸ್ಟಾರ್ ವರದಿಗಾರ'} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl cursor-help">✨</span>
                  <span title={language === 'en' ? 'Certified' : 'ಪ್ರಮಾಣೀಕೃತ'} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl cursor-help">🎖️</span>
                  <span title={language === 'en' ? 'Volunteer' : 'ಸ್ವಯಂಸೇವಕ'} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl cursor-help">🤝</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {language === 'en' 
                  ? 'Ramesh has been the top contributor in Indiranagar for 3 months straight. His reports have a 100% AI verification accuracy rate.'
                  : 'ರಮೇಶ್ ಅವರು ಸತತ 3 ತಿಂಗಳಿನಿಂದ ಇಂದಿರಾನಗರದ ಉನ್ನತ ಕೊಡುಗೆದಾರರಾಗಿದ್ದಾರೆ. ಅವರ ವರದಿಗಳು 100% AI ಪರಿಶೀಲನೆಯ ನಿಖರತೆಯನ್ನು ಹೊಂದಿವೆ.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ward Insight Modal */}
      {showWardModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 bg-gov-900 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{labels.wardInsight}</h2>
                <div className="text-[10px] font-black text-gov-200 uppercase tracking-widest">Bengaluru Ward #80</div>
              </div>
              <button onClick={() => setShowWardModal(false)} className="p-2 hover:bg-white/10 rounded-xl">✕</button>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl text-center">
                  <div className="text-2xl font-black text-gov-900">142</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{labels.totalReports}</div>
                </div>
                <div className="p-4 bg-green-50 rounded-2xl text-center">
                  <div className="text-2xl font-black text-green-600">139</div>
                  <div className="text-[10px] font-bold text-green-600 uppercase tracking-widest">{labels.resolved}</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{language === 'en' ? 'Active Volunteers' : 'ಸಕ್ರಿಯ ಸ್ವಯಂಸೇವಕರು'}</div>
                <div className="flex -space-x-3">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gov-100 flex items-center justify-center text-xs font-bold text-gov-700 shadow-sm">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">+12</div>
                </div>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed italic">
                "Indiranagar maintains the highest resolution rate due to active citizen participation and weekly cleanup drives."
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Group Insight Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 bg-blue-600 text-white flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">{language === 'en' ? 'Lalbagh Friends' : 'ಲಾಲ್‌ಬಾಗ್ ಫ್ರೆಂಡ್ಸ್'}</h2>
                <div className="text-[10px] font-black text-blue-200 uppercase tracking-widest">{labels.verifiedGroup}</div>
              </div>
              <button onClick={() => setShowGroupModal(false)} className="p-2 hover:bg-white/10 rounded-xl">✕</button>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-black text-blue-900">24 {labels.members}</div>
                  <div className="text-xs font-bold text-blue-600 tracking-wide uppercase">{language === 'en' ? 'Active Daily' : 'ಪ್ರತಿದಿನ ಸಕ್ರಿಯ'}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <div className="text-xl font-black text-gray-900">480</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{labels.hoursVolunteered}</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <div className="text-xl font-black text-gray-900">12</div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{labels.drivesOrganized}</div>
                </div>
              </div>
              <div className="p-4 border border-blue-100 rounded-2xl text-sm text-blue-800 bg-blue-50/30">
                <Star className="w-4 h-4 mb-2" />
                Recently completed a major waste-segregation awareness drive in Basavanagudi.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="gov-card">
        {/* Table header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{labels.overallImpact}</h2>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setTimeFilter('month')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                timeFilter === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>{labels.thisMonth}</button>
            <button onClick={() => setTimeFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                timeFilter === 'all' ? 'bg-gov-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>{labels.allTime}</button>
          </div>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <div className="col-span-1">{labels.rank}</div>
          <div className="col-span-4">{labels.citizen}</div>
          <div className="col-span-2">{labels.impactPoints}</div>
          <div className="col-span-3">{labels.reputation}</div>
          <div className="col-span-2">{labels.badges}</div>
        </div>

        {/* Rows */}
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-12 gap-4 px-6 py-5 border-b border-gray-50">
              <div className="col-span-1"><div className="w-8 h-8 rounded-full bg-gray-100 animate-pulse" /></div>
              <div className="col-span-4"><div className="h-5 bg-gray-100 rounded w-3/4 animate-pulse" /></div>
              <div className="col-span-2"><div className="h-5 bg-gray-100 rounded w-1/2 animate-pulse" /></div>
              <div className="col-span-3"><div className="h-5 bg-gray-100 rounded w-2/3 animate-pulse" /></div>
              <div className="col-span-2"><div className="h-5 bg-gray-100 rounded w-1/2 animate-pulse" /></div>
            </div>
          ))
        ) : (
          displayData.map((user, i) => {
            const rep = getReputation(user.points);
            const badges = getBadges(user, language);
            const isTop3 = i < 3;

            return (
              <div key={user.id} className={`grid grid-cols-12 gap-4 px-6 py-5 items-center border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                i === 0 ? 'bg-amber-50/30' : ''
              }`}>
                {/* Rank */}
                <div className="col-span-1">
                  {isTop3 ? (
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                      i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-gray-300 text-gray-700' : 'bg-amber-600 text-white'
                    }`}>{i + 1}</div>
                  ) : (
                    <span className="text-sm font-semibold text-gray-400 ml-2.5">{i + 1}</span>
                  )}
                </div>

                {/* Citizen */}
                <div className="col-span-4 flex items-center gap-3">
                  {isTop3 ? (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : 'bg-amber-700'
                    }`}>{(user.display_name || user.full_name || 'U').charAt(0).toUpperCase()}</div>
                  ) : null}
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{user.display_name || user.full_name || 'Citizen'}</div>
                    <div className="text-xs text-gray-400">{user.ward}</div>
                  </div>
                </div>

                {/* Impact Points */}
                <div className="col-span-2">
                  <span className={`text-sm font-bold ${isTop3 ? 'text-gov-800' : 'text-gray-700'}`}>
                    {(user.points || 0).toLocaleString()}
                  </span>
                </div>

                {/* Reputation */}
                <div className="col-span-3">
                  {isTop3 ? (
                    <span className={`badge ${rep.color} text-[10px] tracking-wider`}>{language === 'en' ? rep.label_en : rep.label_kn}</span>
                  ) : (
                    <span className="text-xs font-semibold text-gray-500 tracking-wide">{language === 'en' ? rep.label_en : rep.label_kn}</span>
                  )}
                </div>

                {/* Badges */}
                <div className="col-span-2 flex items-center gap-1">
                  {badges.length > 0 ? badges.map((b, bi) => (
                    <span key={bi} title={b.title} className="text-base cursor-help">{b.icon}</span>
                  )) : (
                    <span className="text-gray-300 text-sm">—</span>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* View Full */}
        <div className="p-4 text-center">
          <button className="text-sm font-semibold text-gov-800 hover:text-gov-900 hover:underline transition-colors">
            {labels.viewFull}
          </button>
        </div>
      </div>
    </div>
  );
}

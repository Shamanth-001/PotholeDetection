import { useState, useEffect } from 'react';
import api from '../services/api';
import { Trophy, Award, TrendingUp, Users, MapPin, Star, Shield, Zap, Crown } from 'lucide-react';

const REPUTATION_TIERS = [
  { min: 10000, label: 'LEGENDARY', color: 'bg-amber-500 text-white', textColor: 'text-amber-600' },
  { min: 5000, label: 'VETERAN', color: 'bg-blue-600 text-white', textColor: 'text-blue-600' },
  { min: 2000, label: 'ELITE', color: 'bg-green-600 text-white', textColor: 'text-green-600' },
  { min: 500, label: 'EXPERT', color: 'bg-gray-500 text-white', textColor: 'text-gray-500' },
  { min: 100, label: 'ACTIVE', color: 'bg-gray-400 text-white', textColor: 'text-gray-400' },
  { min: 0, label: 'NEWCOMER', color: 'bg-gray-300 text-gray-700', textColor: 'text-gray-400' },
];

function getReputation(points) {
  return REPUTATION_TIERS.find(t => points >= t.min) || REPUTATION_TIERS[REPUTATION_TIERS.length - 1];
}

function getBadges(user) {
  const badges = [];
  if (user.reports_submitted >= 100) badges.push({ icon: '🏆', title: 'Centurion' });
  if (user.reports_submitted >= 50) badges.push({ icon: '✨', title: 'Star Reporter' });
  if (user.certificates_earned >= 3) badges.push({ icon: '🎖️', title: 'Certified' });
  if (parseFloat(user.volunteer_hours || 0) >= 10) badges.push({ icon: '🤝', title: 'Volunteer' });
  return badges;
}

// Ward names for Bangalore areas
const WARDS = ['Jayanagar Ward', 'Malleshwaram Ward', 'Koramangala Ward', 'Whitefield', 'HSR Layout',
  'Indiranagar', 'BTM Layout', 'JP Nagar', 'Basavanagudi', 'Rajajinagar'];

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [highlights, setHighlights] = useState(null);
  const [timeFilter, setTimeFilter] = useState('all');
  const [loading, setLoading] = useState(true);

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

  // Generate display data — if no real users, show demo placeholders
  const displayData = leaderboard.length > 0
    ? leaderboard.map((u, i) => ({ ...u, ward: WARDS[i % WARDS.length] }))
    : [
        { id: 1, display_name: 'Priya Sharma', points: 12450, reports_submitted: 142, certificates_earned: 5, volunteer_hours: 48, ward: 'Jayanagar Ward' },
        { id: 2, display_name: 'Rahul Hegde', points: 10820, reports_submitted: 118, certificates_earned: 3, volunteer_hours: 32, ward: 'Malleshwaram Ward' },
        { id: 3, display_name: 'Suresh Kumar', points: 9540, reports_submitted: 95, certificates_earned: 2, volunteer_hours: 24, ward: 'Koramangala Ward' },
        { id: 4, display_name: 'Lakshmi Devi', points: 8210, reports_submitted: 76, certificates_earned: 1, volunteer_hours: 16, ward: 'Whitefield' },
        { id: 5, display_name: 'Karthik S.', points: 7900, reports_submitted: 68, certificates_earned: 1, volunteer_hours: 12, ward: 'HSR Layout' },
      ];

  const topReporterName = highlights?.top_reporter?.display_name || displayData[0]?.display_name || 'Ananya R.';
  const topReporterCount = highlights?.top_reporter?.reports_submitted || displayData[0]?.reports_submitted || 142;

  return (
    <div className="p-6 lg:p-8">
      {/* Hero Banner — dark green */}
      <div className="rounded-2xl bg-gov-950 text-white p-8 mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl lg:text-4xl font-extrabold mb-2">Citizen Champions</h1>
          <p className="text-gov-200 max-w-lg leading-relaxed">
            Celebrating the heroes making Bengaluru cleaner, greener, and more livable. Every report matters.
          </p>
        </div>
        {/* Trophy decoration */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 opacity-20">
          <Trophy className="w-32 h-32 text-amber-400" strokeWidth={1} />
        </div>
      </div>

      {/* Highlight Cards — 3 across */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {/* Top Reporter */}
        <div className="gov-card p-5 gov-card-hover">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
              <Crown className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Top Reporter</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900">{topReporterName}</h3>
          <p className="text-sm text-gray-500">{topReporterCount} Issues Resolved</p>
          <p className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +12 this week
          </p>
        </div>

        {/* Cleanest Ward */}
        <div className="gov-card p-5 gov-card-hover border-l-4 border-l-gov-600">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-gov-50 flex items-center justify-center mb-3">
              <MapPin className="w-5 h-5 text-gov-700" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cleanest Ward</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900">Indiranagar</h3>
          <p className="text-sm text-gray-500">98% Resolution Rate</p>
          <p className="text-xs text-gov-700 font-medium mt-2 flex items-center gap-1">
            <Award className="w-3 h-3" /> Ward Rank: #1
          </p>
        </div>

        {/* Community Hero */}
        <div className="gov-card p-5 gov-card-hover">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Community Hero</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900">Lalbagh Friends</h3>
          <p className="text-sm text-gray-500">2.4k Community Points</p>
          <p className="text-xs text-blue-600 font-medium mt-2 flex items-center gap-1">
            <Star className="w-3 h-3" /> Active since 2021
          </p>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="gov-card">
        {/* Table header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Overall Impact Points</h2>
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setTimeFilter('month')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                timeFilter === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>This Month</button>
            <button onClick={() => setTimeFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                timeFilter === 'all' ? 'bg-gov-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>All Time</button>
          </div>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <div className="col-span-1">Rank</div>
          <div className="col-span-4">Citizen</div>
          <div className="col-span-2">Impact Points</div>
          <div className="col-span-3">Reputation</div>
          <div className="col-span-2">Badges</div>
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
            const badges = getBadges(user);
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
                    <span className={`badge ${rep.color} text-[10px] tracking-wider`}>{rep.label}</span>
                  ) : (
                    <span className="text-xs font-semibold text-gray-500 tracking-wide">{rep.label}</span>
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
            View Full Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}

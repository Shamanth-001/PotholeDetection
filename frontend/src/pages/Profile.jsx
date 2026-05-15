import { useEffect, useState } from 'react';
import { useAuthStore } from '../store';
import api from '../services/api';
import { User, Award, FileText, TrendingUp, Zap, Clock, Shield } from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me').then(res => {
      if (res.data?.data?.user) { setProfile(res.data.data.user); updateUser(res.data.data.user); }
    }).catch(console.error).finally(() => setLoading(false));
  }, [updateUser]);

  const p = profile || user;

  const stats = [
    { icon: FileText, label: 'Reports Submitted', value: p?.reports_submitted || 0, color: '#1B5E20' },
    { icon: TrendingUp, label: 'Upvotes Given', value: p?.upvotes_given || 0, color: '#4CAF50' },
    { icon: Award, label: 'Certificates Earned', value: p?.certificates_earned || 0, color: '#FF9800' },
    { icon: Clock, label: 'Volunteer Hours', value: parseFloat(p?.volunteer_hours || 0).toFixed(1), color: '#9C27B0' },
  ];

  const roleLabels = { admin: 'Administrator', volunteer: 'Volunteer', citizen: 'Citizen' };
  const roleBg = { admin: 'bg-red-50 text-red-700', volunteer: 'bg-green-50 text-green-700', citizen: 'bg-gov-50 text-gov-900' };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header card */}
        <div className="gov-card p-8 mb-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gov-900 flex items-center justify-center text-3xl font-bold text-white">
              {p?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{p?.full_name || 'User'}</h1>
              <p className="text-gray-500 text-sm">{p?.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`badge capitalize ${roleBg[p?.role] || roleBg.citizen}`}>
                  <Shield className="w-3 h-3 mr-1" />{roleLabels[p?.role] || 'Citizen'}
                </span>
                <span className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                  <Zap className="w-4 h-4" /> {p?.points || 0} points
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {stats.map((s, i) => (
            <div key={i} className="gov-card gov-card-hover p-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ background: `${s.color}15` }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="gov-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Info</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Member since</span>
              <span className="text-gray-900 font-medium">{p?.created_at ? new Date(p.created_at).toLocaleDateString() : '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Display Name</span>
              <span className="text-gray-900 font-medium">{p?.display_name || '—'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Reports Verified</span>
              <span className="text-gray-900 font-medium">{p?.reports_verified || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

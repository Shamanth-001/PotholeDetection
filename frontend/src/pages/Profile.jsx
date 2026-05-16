import { useEffect, useState } from 'react';
import { useAuthStore, useUIStore } from '../store';
import api from '../services/api';
import { User, Award, FileText, TrendingUp, Zap, Clock, Shield } from 'lucide-react';

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const { language } = useUIStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const labels = {
    reportsSubmitted: language === 'en' ? 'Reports Submitted' : 'ಸಲ್ಲಿಸಿದ ವರದಿಗಳು',
    upvotesGiven: language === 'en' ? 'Upvotes Given' : 'ನೀಡಿದ ಅಪ್‌ವೋಟ್‌ಗಳು',
    certificatesEarned: language === 'en' ? 'Certificates Earned' : 'ಗಳಿಸಿದ ಪ್ರಮಾಣಪತ್ರಗಳು',
    volunteerHours: language === 'en' ? 'Volunteer Hours' : 'ಸ್ವಯಂಸೇವೆಯ ಸಮಯ',
    administrator: language === 'en' ? 'Administrator' : 'ನಿರ್ವಾಹಕರು',
    volunteer: language === 'en' ? 'Volunteer' : 'ಸ್ವಯಂಸೇವಕರು',
    citizen: language === 'en' ? 'Citizen' : 'ನಾಗರಿಕರು',
    points: language === 'en' ? 'points' : 'ಪಾಯಿಂಟ್ಸ್',
    myCertificates: language === 'en' ? 'My Certificates' : 'ನನ್ನ ಪ್ರಮಾಣಪತ್ರಗಳು',
    total: language === 'en' ? 'Total' : 'ಒಟ್ಟು',
    downloadPdf: language === 'en' ? 'Download PDF' : 'PDF ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ',
    noCertificates: language === 'en' ? 'No certificates yet.' : 'ಇನ್ನೂ ಯಾವುದೇ ಪ್ರಮಾಣಪತ್ರಗಳಿಲ್ಲ.',
    earnFirst: language === 'en' ? 'Complete volunteer drives or reach 100 points to earn your first certificate!' : 'ನಿಮ್ಮ ಮೊದಲ ಪ್ರಮಾಣಪತ್ರವನ್ನು ಪಡೆಯಲು ಸ್ವಯಂಸೇವಕ ಡ್ರೈವ್‌ಗಳನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ ಅಥವಾ 100 ಪಾಯಿಂಟ್ಸ್ ತಲುಪಿ!',
    rewardStore: language === 'en' ? 'Reward Store' : 'ರಿವಾರ್ಡ್ ಸ್ಟೋರ್',
    redeemHardEarned: language === 'en' ? 'Redeem your hard-earned points for official perks' : 'ನಿಮ್ಮ ಪಾಯಿಂಟ್ಸ್‌ಗಳನ್ನು ಅಧಿಕೃತ ಸವಲತ್ತುಗಳಿಗಾಗಿ ಬಳಸಿ',
    yourBalance: language === 'en' ? 'Your Balance' : 'ನಿಮ್ಮ ಬ್ಯಾಲೆನ್ಸ್',
    redeemFor: language === 'en' ? 'Redeem for' : 'ಪಡೆಯಲು',
    accountInfo: language === 'en' ? 'Account Info' : 'ಖಾತೆ ಮಾಹಿತಿ',
    memberSince: language === 'en' ? 'Member since' : 'ಇಂದಿನಿಂದ ಸದಸ್ಯರು',
    displayName: language === 'en' ? 'Display Name' : 'ಪ್ರದರ್ಶನ ಹೆಸರು',
    reportsVerified: language === 'en' ? 'Reports Verified' : 'ಪರಿಶೀಲಿಸಿದ ವರದಿಗಳು',
    issued: language === 'en' ? 'Issued' : 'ನೀಡಲಾಗಿದೆ',
    eliteCertificate: language === 'en' ? 'Elite Citizen Certificate' : 'ಎಲೈಟ್ ನಾಗರಿಕ ಪ್ರಮಾಣಪತ್ರ',
    volunteerHero: language === 'en' ? 'Volunteer Hero Recognition' : 'ಸ್ವಯಂಸೇವಕ ಹೀರೋ ಮಾನ್ಯತೆ',
    bbmpCertificate: language === 'en' ? 'Official BBMP Certificate' : 'ಅಧಿಕೃತ ಬಿಬಿಎಂಪಿ ಪ್ರಮಾಣಪತ್ರ',
    digitalVerified: language === 'en' ? 'Digital & Verified' : 'ಡಿಜಿಟಲ್ ಮತ್ತು ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
    nammaTshirt: language === 'en' ? 'Official "Namma" T-Shirt' : 'ಅಧಿಕೃತ "ನಮ್ಮ" ಟಿ-ಶರ್ಟ್',
    limitedEdition: language === 'en' ? 'Limited Edition Merchandise' : 'ಲಿಮಿಟೆಡ್ ಎಡಿಷನ್ ಮರ್ಚಂಡೈಸ್',
    citizenKit: language === 'en' ? 'Eco-Friendly Citizen Kit' : 'ಪರಿಸರ ಸ್ನೇಹಿ ಸಿಟಿಜನ್ ಕಿಟ್',
    kitIncludes: language === 'en' ? 'Bottle, Bag & Toolset' : 'ಬಾಟಲ್, ಬ್ಯಾಗ್ ಮತ್ತು ಟೂಲ್‌ಸೆಟ್',
    cleanupCap: language === 'en' ? 'Official "Cleanup Leader" Cap' : 'ಅಧಿಕೃತ "ಕ್ಲೀನಪ್ ಲೀಡರ್" ಕ್ಯಾಪ್',
    headwear: language === 'en' ? 'Limited Edition Headwear' : 'ಲಿಮಿಟೆಡ್ ಎಡಿಷನ್ ಹೆಡ್‌ವೇರ್',
  };

  useEffect(() => {
    api.get('/auth/me').then(res => {
      if (res.data?.data?.user) { setProfile(res.data.data.user); updateUser(res.data.data.user); }
    }).catch(console.error).finally(() => setLoading(false));
  }, [updateUser]);

  const p = profile || user;

  const stats = [
    { icon: FileText, label: labels.reportsSubmitted, value: p?.reports_submitted || 0, color: '#1B5E20' },
    { icon: TrendingUp, label: labels.upvotesGiven, value: p?.upvotes_given || 0, color: '#4CAF50' },
    { icon: Award, label: labels.certificatesEarned, value: p?.certificates_earned || 0, color: '#FF9800' },
    { icon: Clock, label: labels.volunteerHours, value: parseFloat(p?.volunteer_hours || 0).toFixed(1), color: '#9C27B0' },
  ];

  const roleLabels = { admin: labels.administrator, volunteer: labels.volunteer, citizen: labels.citizen };
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
                  <Shield className="w-3 h-3 mr-1" />{roleLabels[p?.role] || labels.citizen}
                </span>
                <span className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                  <Zap className="w-4 h-4" /> {p?.points || 0} {labels.points}
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

        {/* My Certificates Section */}
        <div className="gov-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" /> {labels.myCertificates}
            </h3>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{p?.certificates_earned || 0} {labels.total}</span>
          </div>
          
          {p?.certificates_earned > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100 group hover:bg-amber-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <FileText className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <div className="font-bold text-amber-900">{labels.eliteCertificate}</div>
                    <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{labels.issued}: Dec 2023</div>
                  </div>
                </div>
                <button className="p-2 bg-amber-600 text-white rounded-lg text-xs font-bold px-4 shadow-md group-hover:bg-amber-700 transition-colors">
                  {labels.downloadPdf}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gov-50 rounded-2xl border border-gov-100 group hover:bg-gov-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <Shield className="w-6 h-6 text-gov-700" />
                  </div>
                  <div>
                    <div className="font-bold text-gov-900">{labels.volunteerHero}</div>
                    <div className="text-[10px] font-black text-gov-600 uppercase tracking-widest">{labels.issued}: Nov 2023</div>
                  </div>
                </div>
                <button className="p-2 bg-gov-700 text-white rounded-lg text-xs font-bold px-4 shadow-md group-hover:bg-gov-800 transition-colors">
                  {labels.downloadPdf}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
              <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">{labels.noCertificates}</p>
              <p className="text-xs text-gray-400 mt-1">{labels.earnFirst}</p>
            </div>
          )}
        </div>

        {/* Reward Store / Redeem Points */}
        <div className="gov-card p-6 mb-6 border-l-4 border-l-amber-500 bg-amber-50/10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" /> {labels.rewardStore}
              </h3>
              <p className="text-xs text-gray-500 mt-1">{labels.redeemHardEarned}</p>
            </div>
            <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-amber-100">
              <span className="text-xs font-black text-gray-400 uppercase mr-2">{labels.yourBalance}</span>
              <span className="text-lg font-black text-amber-600">{p?.points || 0}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reward 1 */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Award className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">{labels.bbmpCertificate}</div>
                  <div className="text-[10px] text-gray-500 italic">{labels.digitalVerified}</div>
                </div>
              </div>
              <button className="w-full py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gov-800 transition-colors flex items-center justify-center gap-2">
                {labels.redeemFor} 500 {labels.points}
              </button>
            </div>

            {/* Reward 2 */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">{labels.nammaTshirt}</div>
                  <div className="text-[10px] text-gray-500 italic">{labels.limitedEdition}</div>
                </div>
              </div>
              <button className="w-full py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition-colors">
                {labels.redeemFor} 1,500 {labels.points}
              </button>
            </div>

            {/* Reward 3 */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">{labels.citizenKit}</div>
                  <div className="text-[10px] text-gray-500 italic">{labels.kitIncludes}</div>
                </div>
              </div>
              <button className="w-full py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-colors">
                {labels.redeemFor} 2,500 {labels.points}
              </button>
            </div>

            {/* Reward 4 */}
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">{labels.cleanupCap}</div>
                  <div className="text-[10px] text-gray-500 italic">{labels.headwear}</div>
                </div>
              </div>
              <button className="w-full py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors">
                {labels.redeemFor} 1,000 {labels.points}
              </button>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="gov-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{labels.accountInfo}</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">{labels.memberSince}</span>
              <span className="text-gray-900 font-medium">{p?.created_at ? new Date(p.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'kn-IN') : '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">{labels.displayName}</span>
              <span className="text-gray-900 font-medium">{p?.display_name || '—'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">{labels.reportsVerified}</span>
              <span className="text-gray-900 font-medium">{p?.reports_verified || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

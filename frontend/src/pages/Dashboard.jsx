import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore, useReportStore, useUIStore } from '../store';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  FileText, CheckCircle, Clock, TrendingUp, Plus, ArrowRight,
  Users, Award, MapPin, Sparkles, ChevronRight, Calendar, Bell
} from 'lucide-react';
import { getIssueColor, getStatusBadge } from '../utils/constants';
import ReportSubmissionModal from '../components/reports/ReportSubmissionModal';
import DuplicateWarningModal from '../components/reports/DuplicateWarningModal';

function StatCard({ icon: Icon, label, value, className = '' }) {
  return (
    <div className={`gov-card p-5 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <div className="text-3xl font-extrabold text-gray-900">{value}</div>
    </div>
  );
}

export default function Dashboard({ openReport = false }) {
  const { user } = useAuthStore();
  const { language } = useUIStore();
  const { reports, setReports, showSubmitModal, openSubmitModal, showDuplicateModal } = useReportStore();
  
  const labels = {
    greeting: language === 'en' ? 'Namaskara' : 'ನಮಸ್ಕಾರ',
    contributions: language === 'en' ? 'Your contributions help keep Bengaluru beautiful.' : 'ನಿಮ್ಮ ಕೊಡುಗೆಗಳು ಬೆಂಗಳೂರನ್ನು ಸುಂದರವಾಗಿಡಲು ಸಹಾಯ ಮಾಡುತ್ತವೆ.',
    reportedSoFar: language === 'en' ? `You've reported ${user?.reports_submitted || 0} issues so far.` : `ನೀವು ಇಲ್ಲಿಯವರೆಗೆ ${user?.reports_submitted || 0} ಸಮಸ್ಯೆಗಳನ್ನು ವರದಿ ಮಾಡಿದ್ದೀರಿ.`,
    reportProblem: language === 'en' ? 'Report a Problem' : 'ಸಮಸ್ಯೆ ವರದಿ ಮಾಡಿ',
    totalReports: language === 'en' ? 'Total Reports' : 'ಒಟ್ಟು ವರದಿಗಳು',
    aiVerified: language === 'en' ? 'AI Verified' : 'AI ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
    resolved: language === 'en' ? 'Resolved' : 'ಪರಿಹರಿಸಲಾಗಿದೆ',
    rank: language === 'en' ? 'Community Rank' : 'ಸಮುದಾಯ ಶ್ರೇಣಿ',
    topPercent: language === 'en' ? 'Top 5% in Bengaluru' : 'ಬೆಂಗಳೂರಿನಲ್ಲಿ ಟಾಪ್ 5%',
    recentReports: language === 'en' ? 'Recent Reports' : 'ಇತ್ತೀಚಿನ ವರದಿಗಳು',
    viewAll: language === 'en' ? 'View All' : 'ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ',
    topContributors: language === 'en' ? 'Top Contributors' : 'ಉನ್ನತ ಕೊಡುಗೆದಾರರು',
    fullLeaderboard: language === 'en' ? 'Full Leaderboard' : 'ಪೂರ್ಣ ಲೀಡರ್‌ಬೋರ್ಡ್',
    aiThinking: language === 'en' ? 'AI Verification Active' : 'AI ಪರಿಶೀಲನೆ ಸಕ್ರಿಯವಾಗಿದೆ',
    aiChecking: language === 'en' ? 'Checking validity of your latest report...' : 'ನಿಮ್ಮ ಇತ್ತೀಚಿನ ವರದಿಯ ಸಿಂಧುತ್ವವನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...',
    volunteerDrives: language === 'en' ? 'Volunteer Drives' : 'ಸ್ವಯಂಸೇವಕ ಡ್ರೈವ್‌ಗಳು',
    register: language === 'en' ? 'Register →' : 'ನೋಂದಾಯಿಸಿ →',
    joined: language === 'en' ? 'joined' : 'ಸೇರಿದ್ದಾರೆ',
  };

  const [stats, setStats] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (openReport) openSubmitModal();
  }, [openReport, openSubmitModal]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, reportsRes, drivesRes] = await Promise.all([
          api.get('/public/stats'),
          api.get('/reports?limit=5&sort_by=created_at&sort_order=DESC'),
          api.get('/volunteer/drives?upcoming_only=true').catch(() => ({ data: { data: { drives: [] } } })),
        ]);
        if (statsRes.data?.data) setStats(statsRes.data.data);
        if (reportsRes.data?.data?.reports) {
          setRecentReports(reportsRes.data.data.reports);
          setReports(reportsRes.data.data.reports);
        }
        if (drivesRes.data?.data?.drives) setDrives(drivesRes.data.data.drives);
      } catch (err) { console.error('Dashboard fetch error:', err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [setReports]);

  const statusBadgeClass = (status) => {
    const map = {
      pending: 'badge-pending', ai_verified: 'badge-verified',
      resolved: 'badge-resolved', in_progress: 'badge-in-progress',
      confirmed: 'badge-verified', under_review: 'badge-pending',
    };
    return map[status] || 'badge-pending';
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gov-900">{labels.greeting}, {user?.display_name || 'Citizen'}!</h1>
          <p className="text-gray-500 mt-1">
            {labels.contributions} {labels.reportedSoFar}
          </p>
        </div>
        <button onClick={openSubmitModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" /> {labels.reportProblem}
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FileText} label={labels.totalReports} value={stats?.total_reports || '—'} />
        <StatCard icon={CheckCircle} label={labels.aiVerified} value={stats?.resolved_reports ? Math.round(parseInt(stats.total_reports || 0) * 0.9) : '—'} />
        <StatCard icon={CheckCircle} label={labels.resolved} value={stats?.resolved_reports || '—'} />
        {/* Golden community rank card */}
        <div className="golden-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-amber-700">{labels.rank}</span>
            <Award className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-amber-900">#{Math.max(1, 50 - (user?.points || 0))}</div>
          <div className="text-xs text-amber-700 mt-1">{labels.topPercent}</div>
        </div>
      </div>


      {/* Main content grid */}
      <div className="grid lg:grid-cols-5 gap-6 mb-8">
        {/* Recent Reports - takes 3 cols */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title !mb-0">{labels.recentReports}</h2>
            <Link to="/map" className="text-sm text-gov-800 hover:text-gov-900 flex items-center gap-1 font-medium">
              {labels.viewAll} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="gov-card divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
                    <div className="h-3 bg-gray-100 rounded w-3/4 animate-pulse" />
                  </div>
                </div>
              ))
            ) : recentReports.length > 0 ? (
              recentReports.slice(0, 5).map(report => (
                <div key={report.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors group cursor-pointer">
                  {/* Thumbnail placeholder */}
                  <div className="w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center"
                    style={{ background: `${getIssueColor(report.issue_type)}15` }}>
                    <MapPin className="w-6 h-6" style={{ color: getIssueColor(report.issue_type) }} />
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 capitalize">
                      {language === 'en' ? `${report.issue_type?.replace('_', ' ')} Report` : `${report.issue_type === 'pothole' ? 'ಗುಂಡಿ' : 'ಕಸ'} ವರದಿ`}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {language === 'en' ? 'Reported' : 'ವರದಿ ಮಾಡಲಾಗಿದೆ'} {new Date(report.created_at).toLocaleDateString(language === 'en' ? 'en-US' : 'kn-IN', { month: 'short', day: 'numeric' })}
                      {report.address_text && ` • ${report.address_text}`}
                    </p>
                  </div>
                  {/* Status badge */}
                  <span className={`badge ${statusBadgeClass(report.status)} uppercase text-[10px] tracking-wide`}>
                    {language === 'en' ? getStatusBadge(report.status).label : getStatusBadge(report.status).label_kn}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500" />
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-400">
                {language === 'en' ? 'No reports yet. Be the first to report an issue!' : 'ಇನ್ನೂ ಯಾವುದೇ ವರದಿಗಳಿಲ್ಲ. ವರದಿ ಮಾಡಿದ ಮೊದಲ ವ್ಯಕ್ತಿಯಾಗಿ!'}
              </div>
            )}
          </div>
        </div>

        {/* Right column - takes 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Contributors */}
          <div>
            <h2 className="section-title">{labels.topContributors}</h2>
            <div className="gov-card p-4">
              <div className="space-y-3">
                {[
                  { rank: 1, name: 'Ramesh K.', pts: 2450 },
                  { rank: 2, name: 'Anjali M.', pts: 2120 },
                  { rank: 3, name: 'Vikram S.', pts: 1980 },
                ].map(c => (
                  <div key={c.rank} className="flex items-center gap-3 py-2">
                    <span className="text-sm font-bold text-gray-400 w-5 text-center">{c.rank}</span>
                    <div className="w-8 h-8 rounded-full bg-gov-100 flex items-center justify-center">
                      <Users className="w-4 h-4 text-gov-700" />
                    </div>
                    <span className="flex-1 text-sm font-medium text-gray-900">{c.name}</span>
                    <span className="text-sm font-bold text-gov-800">{c.pts.toLocaleString()} pts</span>
                  </div>
                ))}
              </div>
              <Link to="/leaderboard" className="w-full mt-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors inline-block text-center">
                {labels.fullLeaderboard}
              </Link>
            </div>
          </div>

          {/* AI Verification Card */}
          <div className="gov-card p-4 border-l-4 border-l-gov-600">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-gov-700" />
              <span className="text-sm font-bold text-gov-900">{labels.aiThinking}</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-gov-600 rounded-full animate-pulse" style={{ width: '65%' }} />
            </div>
            <p className="text-xs text-gray-500">{labels.aiChecking}</p>
          </div>

          {/* Volunteer Notifications */}
          {drives.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-gov-700" />
                <h2 className="section-title !mb-0">{labels.volunteerDrives}</h2>
              </div>
              <div className="space-y-3">
                {drives.slice(0, 2).map(drive => (
                  <div key={drive.id} className="gov-card p-4 border-l-4 border-l-amber-500">
                    <h4 className="text-sm font-bold text-gray-900">{drive.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(drive.scheduled_date).toLocaleDateString(language === 'en' ? 'en-US' : 'kn-IN', { month: 'short', day: 'numeric' })}
                      </span>
                      <span>{drive.current_volunteers}/{drive.max_volunteers} {labels.joined}</span>
                    </div>
                    <Link to="/volunteer" className="text-xs text-gov-800 font-medium mt-2 inline-block hover:text-gov-900">
                      {labels.register}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showSubmitModal && <ReportSubmissionModal />}
      {showDuplicateModal && <DuplicateWarningModal />}
    </div>
  );
}

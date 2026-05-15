import { useState, useEffect } from 'react';
import { useAuthStore, useReportStore } from '../store';
import api from '../services/api';
import { getIssueColor, getStatusBadge, ISSUE_TYPES } from '../utils/constants';
import ReportSubmissionModal from '../components/reports/ReportSubmissionModal';
import DuplicateWarningModal from '../components/reports/DuplicateWarningModal';
import {
  MapPin, Clock, CheckCircle, Loader2, Send, CircleDot,
  Filter, ImagePlus, AlertCircle, Trash2
} from 'lucide-react';

// Status timeline steps
const TIMELINE_STEPS = [
  { key: 'reported', label: 'Reported', subtext: 'Confirmed with geo-tagging' },
  { key: 'ai_verified', label: 'AI Verified', subtext: '' },
  { key: 'assigned', label: 'Assigned', subtext: '' },
  { key: 'resolved', label: 'Resolved', subtext: '' },
];

function getStatusIndex(status) {
  const map = {
    pending: 0, under_review: 0,
    ai_verified: 1,
    confirmed: 2, in_progress: 2, volunteer_assigned: 2,
    resolved: 3, closed: 3,
  };
  return map[status] ?? 0;
}

function getAiSubtext(report) {
  if (report.issue_type === 'pothole') return 'Pothole detected & classified';
  if (report.issue_type === 'garbage') return 'Solid waste accumulation detected';
  return 'Issue detected & classified';
}

function ReportCard({ report }) {
  const statusIdx = getStatusIndex(report.status);
  const isVerifying = report.status === 'pending' || report.status === 'under_review';
  const issueColor = getIssueColor(report.issue_type);
  const badge = getStatusBadge(report.status);

  const badgeColors = {
    resolved: 'bg-green-600',
    confirmed: 'bg-blue-600',
    in_progress: 'bg-orange-500',
    ai_verified: 'bg-gov-700',
    pending: 'bg-amber-500',
    under_review: 'bg-purple-600',
    volunteer_assigned: 'bg-cyan-600',
  };

  const dateStr = new Date(report.created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <div className="gov-card gov-card-hover overflow-hidden">
      {/* Image area */}
      <div className="relative h-48 bg-gray-100">
        {report.image_url ? (
          <img src={report.image_url} alt={report.issue_type}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; }} />
        ) : null}
        {/* Colored placeholder if no image */}
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ background: `${issueColor}15` }}>
          {report.issue_type === 'pothole'
            ? <AlertCircle className="w-16 h-16 opacity-30" style={{ color: issueColor }} />
            : <Trash2 className="w-16 h-16 opacity-30" style={{ color: issueColor }} />}
        </div>

        {/* Status badge overlay */}
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-md text-[10px] font-bold text-white uppercase tracking-wider ${
            badgeColors[report.status] || 'bg-gray-500'
          }`}>
            {isVerifying ? 'VERIFYING' : badge.label}
          </span>
        </div>

        {/* Date */}
        <div className="absolute top-3 right-3 text-right">
          <div className="text-xs font-medium text-gray-600 bg-white/90 px-2 py-1 rounded-md shadow-sm">
            {dateStr}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-base font-bold text-gray-900 mb-1 capitalize">
          {report.description
            ? report.description.slice(0, 50) + (report.description.length > 50 ? '...' : '')
            : `${report.issue_type?.replace('_', ' ')} Report`}
        </h3>

        {report.address_text && (
          <p className="text-xs text-gray-500 flex items-center gap-1 mb-4">
            <MapPin className="w-3 h-3 flex-shrink-0" /> {report.address_text}
          </p>
        )}

        {/* AI Verification Progress (for pending reports) */}
        {isVerifying && (
          <div className="mb-4 p-3 rounded-lg bg-gov-50 border border-gov-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gov-800">AI Verification Progress</span>
              <span className="text-xs font-bold text-gov-900">
                {report.ai_confidence ? `${Math.round(report.ai_confidence * 100)}%` : '85%'}
              </span>
            </div>
            <div className="w-full h-2 bg-gov-100 rounded-full overflow-hidden">
              <div className="h-full bg-gov-600 rounded-full transition-all duration-1000"
                style={{ width: report.ai_confidence ? `${report.ai_confidence * 100}%` : '85%' }} />
            </div>
            <p className="text-[10px] text-gray-500 mt-1.5 italic">
              Scanning image for infrastructure category and priority level...
            </p>
          </div>
        )}

        {/* Status timeline */}
        <div className="space-y-2.5">
          {TIMELINE_STEPS.map((step, i) => {
            const isComplete = i <= statusIdx;
            const isCurrent = i === statusIdx;

            let subtext = step.subtext;
            if (step.key === 'ai_verified') subtext = getAiSubtext(report);
            if (step.key === 'reported') subtext = 'Confirmed with geo-tagging';
            if (step.key === 'assigned' && isComplete) subtext = 'Sent to Ward Maintenance';
            if (step.key === 'resolved' && isComplete) subtext = 'Issue patched & inspected';

            return (
              <div key={step.key} className="flex items-start gap-3">
                <div className="mt-0.5">
                  {isComplete ? (
                    <CheckCircle className="w-5 h-5 text-gov-600" />
                  ) : (
                    <CircleDot className="w-5 h-5 text-gray-300" />
                  )}
                </div>
                <div>
                  <span className={`text-sm font-semibold ${isComplete ? 'text-gray-900' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                  {subtext && isComplete && (
                    <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Successfully uploaded badge */}
        {isVerifying && (
          <div className="mt-4 flex items-center gap-2 text-xs text-green-600 font-medium">
            <CheckCircle className="w-4 h-4" /> Successfully Uploaded
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReportIssuePage() {
  const { user } = useAuthStore();
  const { showSubmitModal, openSubmitModal, showDuplicateModal } = useReportStore();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: '50', sort_by: 'created_at', sort_order: 'DESC' });
      if (filterType !== 'all') params.set('issue_type', filterType);
      const res = await api.get(`/reports?${params}`);
      if (res.data?.data?.reports) setReports(res.data.data.reports);
    } catch (err) { console.error('Reports fetch:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, [filterType]);

  // Listen for modal close to refresh
  useEffect(() => {
    if (!showSubmitModal) {
      // Refresh when modal closes (report was submitted)
      fetchReports();
    }
  }, [showSubmitModal]);

  const filters = [
    { value: 'all', label: 'All Issues', icon: Filter },
    { value: 'pothole', label: 'Potholes', icon: AlertCircle },
    { value: 'garbage', label: 'Garbage', icon: Trash2 },
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Track the status of your reported municipal issues across Bengaluru.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        {filters.map(f => (
          <button key={f.value} onClick={() => setFilterType(f.value)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium border transition-all ${
              filterType === f.value
                ? 'bg-gov-900 text-white border-gov-900'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}>
            <f.icon className="w-4 h-4" />
            {f.label}
          </button>
        ))}
      </div>

      {/* Reports Grid */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="gov-card overflow-hidden">
              <div className="h-48 bg-gray-100 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-gray-100 rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
                <div className="space-y-2 mt-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-4 bg-gray-50 rounded w-2/3 animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : reports.length > 0 ? (
          <>
            {reports.map(report => (
              <ReportCard key={report.id} report={report} />
            ))}

            {/* "Found another issue?" CTA Card */}
            <div className="gov-card flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-gray-200">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <ImagePlus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Found another issue?</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-xs">
                Upload a photo to start a new report. AI will automatically tag the category.
              </p>
              <button onClick={openSubmitModal} className="btn-primary flex items-center gap-2">
                <Send className="w-4 h-4" /> Report Now
              </button>
            </div>
          </>
        ) : (
          /* Empty state + CTA */
          <div className="col-span-2">
            <div className="gov-card flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-gray-200">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
                <ImagePlus className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No reports yet</h3>
              <p className="text-gray-500 mb-6 max-w-sm">
                Upload a photo to start a new report. AI will automatically tag the category and priority level.
              </p>
              <button onClick={openSubmitModal} className="btn-primary flex items-center gap-2 text-lg !px-8 !py-4">
                <Send className="w-5 h-5" /> Report Now
              </button>
            </div>
          </div>
        )}
      </div>

      {showSubmitModal && <ReportSubmissionModal />}
      {showDuplicateModal && <DuplicateWarningModal />}
    </div>
  );
}

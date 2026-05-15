import { useState } from 'react';
import { useReportStore } from '../../store';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { AlertTriangle, ThumbsUp, MapPin, Clock, X, Loader2, TrendingUp } from 'lucide-react';
import { getIssueColor, getStatusBadge } from '../../utils/constants';
import { useGeolocation } from '../../hooks/useGeolocation';

export default function DuplicateWarningModal() {
  const { duplicateReport, closeDuplicate } = useReportStore();
  const { position } = useGeolocation();
  const [upvoting, setUpvoting] = useState(false);
  const [upvoted, setUpvoted] = useState(false);

  if (!duplicateReport) return null;

  const handleUpvote = async () => {
    setUpvoting(true);
    try {
      await api.post(`/reports/${duplicateReport.id}/upvote`, {
        latitude: position?.lat, longitude: position?.lng,
      });
      setUpvoted(true);
      toast.success('Upvoted! This helps prioritize the issue.');
      setTimeout(closeDuplicate, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upvote');
    } finally { setUpvoting(false); }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/40" onClick={closeDuplicate}>
      <div className="bg-white rounded-xl w-full max-w-md shadow-xl border border-gray-200" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Already Reported</h2>
              <p className="text-xs text-gray-500">This issue exists within 10 meters</p>
            </div>
          </div>
          <button onClick={closeDuplicate} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing report */}
        <div className="p-6">
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full" style={{ background: getIssueColor(duplicateReport.issue_type) }} />
              <span className="text-sm font-semibold text-gray-900 capitalize">{duplicateReport.issue_type?.replace('_', ' ')}</span>
              <span className={`badge ml-auto ${duplicateReport.status === 'resolved' ? 'badge-resolved' : 'badge-pending'}`}>
                {getStatusBadge(duplicateReport.status)?.label}
              </span>
            </div>

            {duplicateReport.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-3">{duplicateReport.description}</p>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(duplicateReport.created_at).toLocaleDateString()}</span>
              <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{duplicateReport.upvote_count} upvotes</span>
              <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />Priority: {duplicateReport.priority_score}</span>
            </div>

            {duplicateReport.distance_meters != null && (
              <div className="mt-3 flex items-center gap-1 text-xs text-gov-700">
                <MapPin className="w-3 h-3" />{duplicateReport.distance_meters.toFixed(1)}m from your location
              </div>
            )}
          </div>

          {/* Upvote */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">Help prioritize this issue by upvoting!</p>
            <button onClick={handleUpvote} disabled={upvoting || upvoted}
              className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all ${
                upvoted
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-gov-900 text-white hover:bg-gov-800 shadow-sm'
              }`}>
              {upvoting ? <Loader2 className="w-5 h-5 animate-spin" /> : upvoted ? '✓ Upvoted!' : <><ThumbsUp className="w-5 h-5" /> Me Too!</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

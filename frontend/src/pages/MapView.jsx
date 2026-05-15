import { useState, useEffect } from 'react';
import { useReportStore, useMapStore } from '../store';
import api from '../services/api';
import { Plus, Filter, X, Layers } from 'lucide-react';
import { ISSUE_TYPES, STATUS_OPTIONS, getIssueColor } from '../utils/constants';
import CivicMap from '../components/map/CivicMap';
import ReportSubmissionModal from '../components/reports/ReportSubmissionModal';
import DuplicateWarningModal from '../components/reports/DuplicateWarningModal';

export default function MapView() {
  const { reports, setReports, showSubmitModal, openSubmitModal, showDuplicateModal } = useReportStore();
  const { filters, setFilter, clearFilters, toggleHeatmap, showHeatmap } = useMapStore();
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.issue_type) params.set('issue_type', filters.issue_type);
    if (filters.status) params.set('status', filters.status);
    params.set('limit', '200');

    setLoading(true);
    api.get(`/reports?${params}`).then(res => {
      if (res.data?.data?.reports) setReports(res.data.data.reports);
    }).catch(console.error).finally(() => setLoading(false));
  }, [filters, setReports]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="h-[calc(100vh-64px)] relative">
      {/* Map fills the screen */}
      <CivicMap reports={reports} loading={loading} />

      {/* Floating controls */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        <button onClick={() => setShowFilters(!showFilters)}
          className="gov-card px-4 py-3 flex items-center gap-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && <span className="w-5 h-5 rounded-full bg-gov-700 text-white text-xs flex items-center justify-center">{activeFilterCount}</span>}
        </button>

        <button onClick={toggleHeatmap}
          className={`gov-card px-4 py-3 flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer ${showHeatmap ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-gray-700 hover:bg-gray-50'}`}>
          <Layers className="w-4 h-4" />
          Heatmap
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="absolute top-4 left-4 z-[1001] w-72 gov-card p-5 mt-24">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Filters</h3>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && <button onClick={clearFilters} className="text-xs text-gov-700 hover:text-gov-900">Clear all</button>}
              <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Issue type */}
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Issue Type</label>
            <div className="space-y-1">
              {ISSUE_TYPES.map(t => (
                <button key={t.value} onClick={() => setFilter('issue_type', filters.issue_type === t.value ? null : t.value)}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    filters.issue_type === t.value ? 'bg-gov-50 text-gov-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
                  }`}>
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: t.color }} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 block">Status</label>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.slice(0, 6).map(s => (
                <button key={s.value} onClick={() => setFilter('status', filters.status === s.value ? null : s.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    filters.status === s.value ? 'border-gov-400 bg-gov-50 text-gov-900' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <button onClick={openSubmitModal} id="report-fab"
        className="fixed bottom-8 right-8 w-14 h-14 bg-gov-900 text-white rounded-full shadow-lg flex items-center justify-center cursor-pointer z-[1000] hover:bg-gov-800 hover:scale-105 active:scale-95 transition-all duration-200">
        <Plus className="w-6 h-6" />
      </button>

      {showSubmitModal && <ReportSubmissionModal />}
      {showDuplicateModal && <DuplicateWarningModal />}
    </div>
  );
}

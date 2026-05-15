import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import api from '../services/api';
import toast from 'react-hot-toast';
import { MAP_CONFIG, ISSUE_TYPES, getIssueColor } from '../utils/constants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { CheckCircle, MapPin, Clock, AlertTriangle, Users, Layers, BarChart3, Activity, Plus, Calendar, Send } from 'lucide-react';

function AdminHeatmap({ points }) {
  const map = useMap();
  const layerRef = useRef(null);
  useEffect(() => {
    if (!map || !points.length) return;
    if (layerRef.current) map.removeLayer(layerRef.current);
    const heatPoints = points.map(p => [p.lat, p.lng, p.intensity || 0.5]);
    layerRef.current = L.heatLayer(heatPoints, {
      radius: 40, blur: 25, maxZoom: 17, max: 1.0, minOpacity: 0.4,
      gradient: { 0.1: '#ffe066', 0.3: '#ffa500', 0.5: '#ff6600', 0.7: '#ff2200', 0.9: '#cc0000', 1.0: '#7f0000' },
    }).addTo(map);
    return () => { if (layerRef.current) map.removeLayer(layerRef.current); };
  }, [map, points]);
  return null;
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="gov-card p-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{value ?? '—'}</div>
          <div className="text-xs text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  // Drive creation form
  const [driveForm, setDriveForm] = useState({
    title: '', description: '', address_text: '',
    scheduled_date: '', start_time: '09:00', end_time: '12:00',
    max_volunteers: 20, target_issue_type: 'garbage',
    latitude: 12.9716, longitude: 77.5946,
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const [analyticsRes, heatmapRes] = await Promise.all([
          api.get(`/admin/analytics?days=${days}`),
          api.get(`/admin/heatmap-data?days=${days}`),
        ]);
        if (analyticsRes.data?.data) setAnalytics(analyticsRes.data.data);
        if (heatmapRes.data?.data?.points) setHeatmapData(heatmapRes.data.data.points);
      } catch (err) { console.error('Admin fetch:', err); }
      finally { setLoading(false); }
    };
    fetchAnalytics();
  }, [days]);

  const handleCreateDrive = async (e) => {
    e.preventDefault();
    if (!driveForm.title || !driveForm.scheduled_date) return toast.error('Title and date are required');
    setCreating(true);
    try {
      await api.post('/admin/drives', driveForm);
      toast.success('Cleanup drive created! Users will see it in Volunteer Hub.');
      setDriveForm({
        title: '', description: '', address_text: '',
        scheduled_date: '', start_time: '09:00', end_time: '12:00',
        max_volunteers: 20, target_issue_type: 'garbage',
        latitude: 12.9716, longitude: 77.5946,
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create drive');
    } finally { setCreating(false); }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'heatmap', label: 'Urgency Heatmap', icon: Layers },
    { id: 'trends', label: 'Trends', icon: Activity },
    { id: 'drives', label: 'Schedule Drive', icon: Calendar },
  ];

  const chartTooltipStyle = { background: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', color: '#212121' };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">City-wide civic intelligence overview</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={days} onChange={e => setDays(Number(e.target.value))} className="input-field !w-auto !py-2 text-sm">
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>All time</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === t.id ? 'bg-gov-900 text-white' : 'text-gray-500 hover:bg-gray-100 border border-gray-200'
            }`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && analytics && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={MapPin} label="Total Reports" value={analytics.overview?.total_reports} color="#1B5E20" />
            <StatCard icon={CheckCircle} label="Resolved" value={analytics.overview?.resolved} color="#4CAF50" />
            <StatCard icon={AlertTriangle} label="Pending" value={analytics.overview?.pending} color="#FF9800" />
            <StatCard icon={Clock} label="Last 24h" value={analytics.overview?.last_24h} color="#9C27B0" />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <div className="gov-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Issues by Type</h3>
              {analytics.by_issue_type?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.by_issue_type.map(d => ({ name: d.issue_type?.replace('_', ' '), count: parseInt(d.count) }))}>
                    <XAxis dataKey="name" tick={{ fill: '#616161', fontSize: 12 }} />
                    <YAxis tick={{ fill: '#616161', fontSize: 12 }} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar dataKey="count" fill="#1B5E20" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-[300px] flex items-center justify-center text-gray-400">No data</div>}
            </div>

            <div className="gov-card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Volunteer Impact</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Completed Drives', value: analytics.volunteer_stats?.completed_drives || 0, color: 'text-green-600' },
                  { label: 'Active Drives', value: analytics.volunteer_stats?.active_drives || 0, color: 'text-gov-700' },
                  { label: 'Active Volunteers', value: analytics.volunteer_stats?.active_volunteers || 0, color: 'text-amber-600' },
                  { label: 'Total Hours', value: `${parseFloat(analytics.volunteer_stats?.total_hours || 0).toFixed(0)}h`, color: 'text-purple-600' },
                ].map((s, i) => (
                  <div key={i} className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'heatmap' && (
        <div className="gov-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Urgency Heatmap — {heatmapData.length} data points</h3>
          <div className="h-[500px] rounded-xl overflow-hidden border border-gray-200">
            <MapContainer center={MAP_CONFIG.center} zoom={MAP_CONFIG.zoom} className="w-full h-full" zoomControl={true}>
              <TileLayer url={MAP_CONFIG.tileUrl} attribution={MAP_CONFIG.tileAttribution} />
              <AdminHeatmap points={heatmapData} />
            </MapContainer>
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
            <span>Intensity:</span>
            <span className="w-4 h-2 rounded bg-green-500" /> Low
            <span className="w-4 h-2 rounded bg-amber-500 ml-2" /> Medium
            <span className="w-4 h-2 rounded bg-red-500 ml-2" /> High
            <span className="w-4 h-2 rounded bg-red-900 ml-2" /> Critical
          </div>
        </div>
      )}

      {activeTab === 'trends' && analytics?.daily_trend && (
        <div className="gov-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Report Trend</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={analytics.daily_trend.map(d => ({ date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), reports: parseInt(d.reports), resolved: parseInt(d.resolved) }))}>
              <XAxis dataKey="date" tick={{ fill: '#616161', fontSize: 12 }} />
              <YAxis tick={{ fill: '#616161', fontSize: 12 }} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Line type="monotone" dataKey="reports" stroke="#1B5E20" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="resolved" stroke="#4CAF50" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-6 mt-4 text-xs text-gray-500 justify-center">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-gov-900" /> Reports</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500" /> Resolved</span>
          </div>
        </div>
      )}

      {activeTab === 'drives' && (
        <div className="max-w-2xl">
          <div className="gov-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gov-50 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-gov-700" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Schedule Cleanup Drive</h3>
                <p className="text-sm text-gray-500">Create a volunteer event — users will see it in their dashboard</p>
              </div>
            </div>

            <form onSubmit={handleCreateDrive} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Drive Title</label>
                <input type="text" value={driveForm.title} onChange={e => setDriveForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g., Koramangala Garbage Cleanup" className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={driveForm.description} onChange={e => setDriveForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe what volunteers will do..." className="input-field resize-none" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input type="text" value={driveForm.address_text} onChange={e => setDriveForm(f => ({ ...f, address_text: e.target.value }))}
                  placeholder="e.g., Near BMSCE Main Gate, Bull Temple Rd" className="input-field" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={driveForm.scheduled_date} onChange={e => setDriveForm(f => ({ ...f, scheduled_date: e.target.value }))}
                    className="input-field" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                  <input type="time" value={driveForm.start_time} onChange={e => setDriveForm(f => ({ ...f, start_time: e.target.value }))}
                    className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input type="time" value={driveForm.end_time} onChange={e => setDriveForm(f => ({ ...f, end_time: e.target.value }))}
                    className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Volunteers</label>
                  <input type="number" value={driveForm.max_volunteers} onChange={e => setDriveForm(f => ({ ...f, max_volunteers: parseInt(e.target.value) }))}
                    className="input-field" min={1} max={200} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Type</label>
                  <select value={driveForm.target_issue_type} onChange={e => setDriveForm(f => ({ ...f, target_issue_type: e.target.value }))}
                    className="input-field">
                    <option value="garbage">Garbage</option>
                    <option value="pothole">Pothole</option>
                  </select>
                </div>
              </div>

              <button type="submit" disabled={creating} className="btn-primary w-full flex items-center justify-center gap-2">
                {creating ? 'Creating...' : <><Send className="w-5 h-5" /> Push Volunteer Drive</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

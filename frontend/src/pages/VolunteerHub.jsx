import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuthStore, useUIStore } from '../store';
import { Calendar, MapPin, Users, Clock, Award, Loader2, Bell, CheckCircle } from 'lucide-react';

function DriveCard({ drive, onRegister, onUnregister, userRegistered, actionLoading, labels }) {
  const progress = Math.min((drive.current_volunteers / drive.max_volunteers) * 100, 100);
  const isFull = drive.current_volunteers >= drive.max_volunteers;

  return (
    <div className="gov-card gov-card-hover p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{drive.title}</h3>
          <p className="text-sm text-gray-500 line-clamp-2">{drive.description}</p>
        </div>
        {drive.target_issue_type && (
          <span className="badge badge-pending capitalize text-xs">{drive.target_issue_type.replace('_', ' ')}</span>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4 text-gov-700" />
          {new Date(drive.scheduled_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          <span className="text-gray-300">•</span>
          <Clock className="w-4 h-4 text-gov-700" />
          {drive.start_time?.slice(0, 5)} – {drive.end_time?.slice(0, 5) || 'TBD'}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4 text-gov-700" />
          {drive.address_text || labels.locationTbd}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4 text-gov-700" />
          {drive.current_volunteers} / {drive.max_volunteers} {labels.volunteers}
          {drive.organizer_name && <span className="text-gray-400">• {labels.organizedBy} {drive.organizer_name}</span>}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${
            progress >= 100 ? 'bg-green-500' : progress >= 60 ? 'bg-gov-600' : 'bg-amber-500'
          }`} style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{Math.round(progress)}% {labels.filled}</span>
          <span>{drive.max_volunteers - drive.current_volunteers} {labels.spotsLeft}</span>
        </div>
      </div>

      {/* Action */}
      {userRegistered ? (
        <button onClick={() => onUnregister(drive.id)} disabled={actionLoading}
          className="w-full py-3 rounded-lg text-sm font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
          {actionLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> {labels.processing}</> : <><CheckCircle className="w-4 h-4" /> {labels.registeredCancel}</>}
        </button>
      ) : (
        <button onClick={() => onRegister(drive.id)} disabled={isFull || actionLoading}
          className={`w-full py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
            isFull ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'btn-primary'
          }`}>
          {actionLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> {labels.registering}</> : isFull ? labels.driveFull : labels.registerNow}
        </button>
      )}
    </div>
  );
}

export default function VolunteerHub() {
  const { user } = useAuthStore();
  const { language } = useUIStore();
  const [drives, setDrives] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('drives');
  const [registeredDrives, setRegisteredDrives] = useState(new Set());
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const labels = {
    volunteerHub: language === 'en' ? 'Volunteer Hub' : 'ಸ್ವಯಂಸೇವಕ ಕೇಂದ್ರ',
    hubDesc: language === 'en' ? 'Join cleanup drives organized by BBMP and earn certificates' : 'ಬಿಬಿಎಂಪಿ ಆಯೋಜಿಸಿದ ಸ್ವಚ್ಛತಾ ಡ್ರೈವ್‌ಗಳಿಗೆ ಸೇರಿ ಮತ್ತು ಪ್ರಮಾಣಪತ್ರಗಳನ್ನು ಗಳಿಸಿ',
    activeDrives: language === 'en' ? 'Active Drives' : 'ಸಕ್ರಿಯ ಡ್ರೈವ್‌ಗಳು',
    myCertificates: language === 'en' ? 'My Certificates' : 'ನನ್ನ ಪ್ರಮಾಣಪತ್ರಗಳು',
    locationTbd: language === 'en' ? 'Location TBD' : 'ಸ್ಥಳ ಇನ್ನೂ ನಿಗದಿಯಾಗಿಲ್ಲ',
    volunteers: language === 'en' ? 'volunteers' : 'ಸ್ವಯಂಸೇವಕರು',
    organizedBy: language === 'en' ? 'Organized by' : 'ಆಯೋಜಿಸಿದವರು',
    filled: language === 'en' ? 'filled' : 'ಭರ್ತಿಯಾಗಿದೆ',
    spotsLeft: language === 'en' ? 'spots left' : 'ಸ್ಥಳಾವಕಾಶ ಬಾಕಿ ಇದೆ',
    processing: language === 'en' ? 'Processing...' : 'ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿದೆ...',
    registeredCancel: language === 'en' ? 'Registered — Click to Cancel' : 'ನೋಂದಾಯಿಸಲಾಗಿದೆ — ರದ್ದುಗೊಳಿಸಲು ಕ್ಲಿಕ್ ಮಾಡಿ',
    registering: language === 'en' ? 'Registering...' : 'ನೋಂದಾಯಿಸಲಾಗುತ್ತಿದೆ...',
    driveFull: language === 'en' ? 'Drive Full' : 'ಡ್ರೈವ್ ಭರ್ತಿಯಾಗಿದೆ',
    registerNow: language === 'en' ? 'Register Now →' : 'ಈಗಲೇ ನೋಂದಾಯಿಸಿ →',
    noDrives: language === 'en' ? 'No upcoming drives. Check back later!' : 'ಯಾವುದೇ ಮುಂಬರುವ ಡ್ರೈವ್‌ಗಳಿಲ್ಲ. ನಂತರ ಪರಿಶೀಲಿಸಿ!',
    noCertificates: language === 'en' ? 'No certificates yet. Join a drive and upload a solution photo to earn one!' : 'ಇನ್ನೂ ಯಾವುದೇ ಪ್ರಮಾಣಪತ್ರಗಳಿಲ್ಲ. ಒಂದು ಡ್ರೈವ್‌ಗೆ ಸೇರಿ ಮತ್ತು ಪ್ರಮಾಣಪತ್ರ ಗಳಿಸಲು ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ!',
    downloadPdf: language === 'en' ? 'Download PDF' : 'PDF ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ',
    aiVerified: language === 'en' ? 'AI Verified' : 'AI ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [drivesRes, certsRes] = await Promise.all([
          api.get('/volunteer/drives?upcoming_only=true'),
          api.get('/volunteer/certificates'),
        ]);
        if (drivesRes.data?.data?.drives) {
          const drivesList = drivesRes.data.data.drives;
          setDrives(drivesList);
          const regSet = new Set();
          drivesList.forEach(d => { if (d.user_registered) regSet.add(d.id); });
          setRegisteredDrives(regSet);
        }
        if (certsRes.data?.data?.certificates) setCertificates(certsRes.data.data.certificates);
      } catch (err) { console.error('Volunteer fetch:', err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleRegister = async (driveId) => {
    if (actionLoadingId) return;
    setActionLoadingId(driveId);
    try {
      await api.post(`/volunteer/drives/${driveId}/register`);
      toast.success(language === 'en' ? 'Registered! +5 points' : 'ನೋಂದಾಯಿಸಲಾಗಿದೆ! +5 ಪಾಯಿಂಟ್ಸ್');
      setRegisteredDrives(prev => new Set(prev).add(driveId));
      setDrives(prev => prev.map(d => d.id === driveId ? { ...d, current_volunteers: d.current_volunteers + 1 } : d));
    } catch (err) { toast.error(err.response?.data?.message || (language === 'en' ? 'Failed' : 'ವಿಫಲವಾಗಿದೆ')); }
    finally { setActionLoadingId(null); }
  };

  const handleUnregister = async (driveId) => {
    if (actionLoadingId) return;
    setActionLoadingId(driveId);
    try {
      await api.post(`/volunteer/drives/${driveId}/unregister`);
      toast.success(language === 'en' ? 'Registration cancelled' : 'ನೋಂದಣಿ ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ');
      setRegisteredDrives(prev => { const s = new Set(prev); s.delete(driveId); return s; });
      setDrives(prev => prev.map(d => d.id === driveId ? { ...d, current_volunteers: Math.max(d.current_volunteers - 1, 0) } : d));
    } catch (err) { toast.error(language === 'en' ? 'Failed to cancel' : 'ರದ್ದುಗೊಳಿಸಲು ವಿಫಲವಾಗಿದೆ'); }
    finally { setActionLoadingId(null); }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-gov-700" /> {labels.volunteerHub}
          </h1>
          <p className="text-gray-500 mt-1">{labels.hubDesc}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {[{ id: 'drives', label: labels.activeDrives, icon: Users }, { id: 'certificates', label: labels.myCertificates, icon: Award }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-gov-900 text-white' : 'text-gray-500 hover:bg-gray-100 border border-gray-200'
            }`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'drives' && (
        <div className="grid md:grid-cols-2 gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-64 rounded-xl bg-gray-100 animate-pulse" />)
          ) : drives.length > 0 ? (
            drives.map(drive => (
              <DriveCard key={drive.id} drive={drive} userRegistered={registeredDrives.has(drive.id)}
                onRegister={handleRegister} onUnregister={handleUnregister}
                actionLoading={actionLoadingId === drive.id} labels={labels} />
            ))
          ) : (
            <div className="col-span-2 text-center py-16 text-gray-400">{labels.noDrives}</div>
          )}
        </div>
      )}

      {activeTab === 'certificates' && (
        <div className="grid md:grid-cols-2 gap-6">
          {certificates.length > 0 ? (
            certificates.map(cert => (
              <div key={cert.id} className="gov-card p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{cert.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{cert.issue_addressed}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                      <span>{new Date(cert.activity_date).toLocaleDateString()}</span>
                      <span>{cert.hours_contributed}h</span>
                      <span>{cert.certificate_number}</span>
                    </div>
                    {cert.verified_by_ai && <span className="badge badge-verified mt-2 text-[10px]">{labels.aiVerified}</span>}
                  </div>
                </div>
                {cert.pdf_url && (
                  <a href={cert.pdf_url} download className="mt-4 block text-center py-2 rounded-lg bg-gov-50 text-gov-800 text-sm font-medium hover:bg-gov-100 transition-colors">
                    {labels.downloadPdf}
                  </a>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-16 text-gray-400">
              {labels.noCertificates}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

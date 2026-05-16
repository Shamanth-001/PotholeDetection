import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useReportStore, useUIStore } from '../../store';
import { useGeolocation } from '../../hooks/useGeolocation';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { X, Camera, MapPin, Send, Loader2, CheckCircle } from 'lucide-react';
import { ISSUE_TYPES } from '../../utils/constants';

export default function ReportSubmissionModal() {
  const { closeSubmitModal, showDuplicate } = useReportStore();
  const { position } = useGeolocation();
  const { language } = useUIStore();

  const labels = {
    reportIssue: language === 'en' ? 'Report an Issue' : 'ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿ',
    photoEvidence: language === 'en' ? 'Photo Evidence' : 'ಫೋಟೋ ಸಾಕ್ಷ್ಯ',
    dragDrop: language === 'en' ? 'Drag & drop or click to upload' : 'ಅಪ್‌ಲೋಡ್ ಮಾಡಲು ಎಳೆಯಿರಿ ಅಥವಾ ಕ್ಲಿಕ್ ಮಾಡಿ',
    maxSize: language === 'en' ? 'JPEG, PNG, WebP — Max 10MB' : 'JPEG, PNG, WebP — ಗರಿಷ್ಠ 10MB',
    issueType: language === 'en' ? 'Issue Type' : 'ಸಮಸ್ಯೆಯ ವಿಧ',
    location: language === 'en' ? 'Location' : 'ಸ್ಥಳ',
    description: language === 'en' ? 'Description (optional)' : 'ವಿವರಣೆ (ಐಚ್ಛಿಕ)',
    describePlaceholder: language === 'en' ? 'Describe the issue...' : 'ಸಮಸ್ಯೆಯನ್ನು ವಿವರಿಸಿ...',
    aiVerified: language === 'en' ? 'AI Verified' : 'AI ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
    detected: language === 'en' ? 'Detected' : 'ಪತ್ತೆಯಾಗಿದೆ',
    confidence: language === 'en' ? 'confidence' : 'ಭರವಸೆ',
    submitting: language === 'en' ? 'Analyzing & Submitting...' : 'ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ ಮತ್ತು ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...',
    submitReport: language === 'en' ? 'Submit Report' : 'ವರದಿ ಸಲ್ಲಿಸಿ',
    useLocation: language === 'en' ? 'Use current location' : 'ಪ್ರಸ್ತುತ ಸ್ಥಳವನ್ನು ಬಳಸಿ',
    uploadError: language === 'en' ? 'Please upload an image' : 'ದಯವಿಟ್ಟು ಚಿತ್ರವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
    typeError: language === 'en' ? 'Select an issue type' : 'ಸಮಸ್ಯೆಯ ವಿಧವನ್ನು ಆರಿಸಿ',
    locationSuccess: language === 'en' ? 'Location updated' : 'ಸ್ಥಳವನ್ನು ನವೀಕರಿಸಲಾಗಿದೆ',
    locationError: language === 'en' ? 'Location not available' : 'ಸ್ಥಳ ಲಭ್ಯವಿಲ್ಲ',
    duplicateWarning: language === 'en' ? 'This issue was already reported nearby!' : 'ಈ ಸಮಸ್ಯೆಯನ್ನು ಈಗಾಗಲೇ ಹತ್ತಿರದಲ್ಲಿ ವರದಿ ಮಾಡಲಾಗಿದೆ!',
    reportSuccess: language === 'en' ? 'Report submitted!' : 'ವರದಿ ಸಲ್ಲಿಸಲಾಗಿದೆ!',
    failError: language === 'en' ? 'Submission failed' : 'ಸಲ್ಲಿಸಲು ವಿಫಲವಾಗಿದೆ',
  };

  const [form, setForm] = useState({
    issue_type: '', description: '',
    latitude: position?.lat || 12.9716,
    longitude: position?.lng || 77.5946,
    address: '',
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);

  const onDrop = useCallback((files) => {
    const file = files[0];
    if (file) { setImage(file); setPreview(URL.createObjectURL(file)); }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] }, maxFiles: 1, maxSize: 10 * 1024 * 1024,
  });

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return toast.error(labels.uploadError);
    if (!form.issue_type) return toast.error(labels.typeError);

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('latitude', form.latitude);
      formData.append('longitude', form.longitude);
      formData.append('issue_type', form.issue_type);
      formData.append('description', form.description);
      formData.append('address', form.address);

      const res = await api.post('/reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

      if (res.data.duplicate) {
        closeSubmitModal();
        showDuplicate(res.data.existing_report);
        toast(labels.duplicateWarning, { icon: '⚠️' });
      } else {
        setAiResult(res.data.ai_analysis);
        toast.success(`${labels.reportSuccess} +${res.data.points_earned} pts`);
        setTimeout(() => {
          closeSubmitModal();
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || labels.failError);
    } finally { setLoading(false); }
  };

  const useCurrentLocation = () => {
    if (position) { update('latitude', position.lat); update('longitude', position.lng); toast.success(labels.locationSuccess); }
    else toast.error(labels.locationError);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/40" onClick={closeSubmitModal}>
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between p-6 pb-4 border-b border-gray-200 bg-white z-10 rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-900">{labels.reportIssue}</h2>
          <button onClick={closeSubmitModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{labels.photoEvidence}</label>
            <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-gov-500 bg-gov-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}>
              <input {...getInputProps()} />
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                  <button type="button" onClick={(e) => { e.stopPropagation(); setImage(null); setPreview(null); }}
                    className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white"><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <div className="py-4">
                  <Camera className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">{labels.dragDrop}</p>
                  <p className="text-xs text-gray-400 mt-1">{labels.maxSize}</p>
                </div>
              )}
            </div>
          </div>

          {/* Issue type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{labels.issueType}</label>
            <div className="grid grid-cols-2 gap-3">
              {ISSUE_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => update('issue_type', t.value)}
                  className={`flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-medium border-2 transition-all ${
                    form.issue_type === t.value ? 'border-gov-600 bg-gov-50 text-gov-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>
                  <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: t.color }} />
                  {language === 'en' ? t.label : t.label_kn}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{labels.location}</label>
            <div className="flex gap-2">
              <div className="flex-1 flex gap-2">
                <input type="number" step="any" value={form.latitude} onChange={e => update('latitude', e.target.value)} placeholder="Lat" className="input-field text-sm flex-1" />
                <input type="number" step="any" value={form.longitude} onChange={e => update('longitude', e.target.value)} placeholder="Lng" className="input-field text-sm flex-1" />
              </div>
              <button type="button" onClick={useCurrentLocation} className="px-3 py-2 bg-gov-50 text-gov-700 rounded-lg hover:bg-gov-100 transition-colors" title={labels.useLocation}>
                <MapPin className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{labels.description}</label>
            <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3}
              placeholder={labels.describePlaceholder} className="input-field resize-none" />
          </div>

          {/* AI Result */}
          {aiResult && (
            <div className="p-4 rounded-xl bg-green-50 border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">{labels.aiVerified}</span>
              </div>
              <p className="text-xs text-gray-600">{labels.detected}: {aiResult.detected_class} ({(aiResult.confidence * 100).toFixed(0)}% {labels.confidence})</p>
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> {labels.submitting}</> : <><Send className="w-5 h-5" /> {labels.submitReport}</>}
          </button>
        </form>
      </div>
    </div>
  );
}

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useReportStore } from '../../store';
import { useGeolocation } from '../../hooks/useGeolocation';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { X, Camera, MapPin, Send, Loader2, CheckCircle } from 'lucide-react';
import { ISSUE_TYPES } from '../../utils/constants';

export default function ReportSubmissionModal() {
  const { closeSubmitModal, showDuplicate } = useReportStore();
  const { position } = useGeolocation();

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
    if (!image) return toast.error('Please upload an image');
    if (!form.issue_type) return toast.error('Select an issue type');

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
        toast('This issue was already reported nearby!', { icon: '⚠️' });
      } else {
        setAiResult(res.data.ai_analysis);
        toast.success(`Report submitted! +${res.data.points_earned} points`);
        setTimeout(() => {
          closeSubmitModal();
          // Refresh the page so user sees their new report
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally { setLoading(false); }
  };

  const useCurrentLocation = () => {
    if (position) { update('latitude', position.lat); update('longitude', position.lng); toast.success('Location updated'); }
    else toast.error('Location not available');
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/40" onClick={closeSubmitModal}>
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between p-6 pb-4 border-b border-gray-200 bg-white z-10 rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-900">Report an Issue</h2>
          <button onClick={closeSubmitModal} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Photo Evidence</label>
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
                  <p className="text-sm text-gray-500">Drag & drop or click to upload</p>
                  <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP — Max 10MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Issue type — only Pothole & Garbage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Issue Type</label>
            <div className="grid grid-cols-2 gap-3">
              {ISSUE_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => update('issue_type', t.value)}
                  className={`flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-medium border-2 transition-all ${
                    form.issue_type === t.value ? 'border-gov-600 bg-gov-50 text-gov-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>
                  <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: t.color }} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <div className="flex gap-2">
              <div className="flex-1 flex gap-2">
                <input type="number" step="any" value={form.latitude} onChange={e => update('latitude', e.target.value)} placeholder="Lat" className="input-field text-sm flex-1" />
                <input type="number" step="any" value={form.longitude} onChange={e => update('longitude', e.target.value)} placeholder="Lng" className="input-field text-sm flex-1" />
              </div>
              <button type="button" onClick={useCurrentLocation} className="px-3 py-2 bg-gov-50 text-gov-700 rounded-lg hover:bg-gov-100 transition-colors" title="Use current location">
                <MapPin className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
            <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3}
              placeholder="Describe the issue..." className="input-field resize-none" />
          </div>

          {/* AI Result */}
          {aiResult && (
            <div className="p-4 rounded-xl bg-green-50 border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">AI Verified</span>
              </div>
              <p className="text-xs text-gray-600">Detected: {aiResult.detected_class} ({(aiResult.confidence * 100).toFixed(0)}% confidence)</p>
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing & Submitting...</> : <><Send className="w-5 h-5" /> Submit Report</>}
          </button>
        </form>
      </div>
    </div>
  );
}

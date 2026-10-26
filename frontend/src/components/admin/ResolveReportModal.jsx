import { useState } from 'react';
import { X, Send, Image } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function ResolveReportModal({ report, onClose, onResolveSuccess }) {
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (notes.trim().length < 10) {
      return toast.error('Resolution notes must be at least 10 characters long.');
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('resolution_notes', notes);
    if (photo) {
      formData.append('resolution_photo', photo);
    }

    try {
      const response = await api.patch(`/reports/${report.id}/resolve`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data?.success) {
        toast.success('Report marked as resolved!');
        onResolveSuccess(response.data.data.report);
        onClose();
      } else {
        toast.error(response.data?.message || 'Failed to resolve report.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error resolving report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-up border border-gray-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gov-900 text-white">
          <div>
            <h3 className="font-bold text-lg">Mark Issue as Resolved</h3>
            <p className="text-xs text-gray-200 mt-0.5 capitalize">
              {report.issue_type} — Ward {report.ward_number || 'N/A'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Instructions */}
          <div className="p-3 bg-green-50 text-green-800 rounded-lg text-xs font-medium border border-green-200">
            Provide resolution notes and optional before/after verification photo to update the citizen and close this ticket.
          </div>

          {/* Notes input */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Resolution Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Explain how this issue was resolved (e.g. BBMP asphalt crew patched pothole, cleaned debris)..."
              className="input-field resize-none focus:ring-2 focus:ring-gov-600 focus:border-gov-600"
              rows={4}
              required
            />
            <div className="flex justify-between items-center mt-1 text-[11px] text-gray-500">
              <span>Minimum 10 characters</span>
              <span className={notes.trim().length >= 10 ? 'text-green-600 font-bold' : 'text-red-500'}>
                {notes.trim().length}/10
              </span>
            </div>
          </div>

          {/* Photo upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">
              Resolution Photo <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            
            <div className="flex gap-4 items-center">
              <label className="flex flex-col items-center justify-center w-36 h-28 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-gov-600 transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Image className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-[10px] text-gray-500 font-medium">Select Image</span>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>

              {photoPreview && (
                <div className="relative w-36 h-28 rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50">
                  <img src={photoPreview} alt="Resolution Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setPhoto(null); setPhotoPreview(null); }}
                    className="absolute top-1.5 right-1.5 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-md"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 btn-primary flex items-center justify-center gap-2"
            >
              {submitting ? (
                'Resolving...'
              ) : (
                <>
                  <Send className="w-4 h-4" /> Mark Resolved
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

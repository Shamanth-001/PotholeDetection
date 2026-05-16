import { useState } from 'react';
import { Mail, Phone, ShieldCheck, FileText, Info } from 'lucide-react';

export default function Footer() {
  const [showLegal, setShowLegal] = useState(null);

  const LegalModal = ({ title, content, onClose }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gov-900 text-white text-left">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white">✕</button>
        </div>
        <div className="p-8 max-h-[60vh] overflow-y-auto text-gray-600 leading-relaxed text-sm text-left">
          {content}
        </div>
        <div className="p-4 bg-gray-50 text-right border-t border-gray-100">
          <button onClick={onClose} className="px-6 py-2 bg-gov-900 text-white rounded-lg font-bold hover:bg-gov-800 transition-colors">Close</button>
        </div>
      </div>
    </div>
  );

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold text-gov-900">Namma Clean Bengaluru</h3>
            <p className="text-sm text-gray-500 mt-1">Official Citizen Engagement Portal</p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
            <button onClick={() => setShowLegal('Privacy Policy')} className="hover:text-gov-900 transition-colors">Privacy Policy</button>
            <button onClick={() => setShowLegal('Terms of Service')} className="hover:text-gov-900 transition-colors">Terms of Service</button>
            <button onClick={() => setShowLegal('Contact Us')} className="hover:text-gov-900 transition-colors">Contact Us</button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            © 2024 Bruhat Bengaluru Mahanagara Palike (BBMP). All Rights Reserved.
          </p>
        </div>
      </div>

      {showLegal === 'Privacy Policy' && (
        <LegalModal title="Privacy Policy" onClose={() => setShowLegal(null)} content={
          <div className="space-y-4">
            <p className="font-bold text-gov-900">Your privacy is paramount.</p>
            <p>Namma Clean Bengaluru collects only the data necessary to verify and address urban infrastructure issues.</p>
            <div className="p-4 bg-gray-50 rounded-xl space-y-2">
              <p><strong>Location Data:</strong> We access your GPS coordinates ONLY when you submit a report.</p>
              <p><strong>Photos:</strong> AI analyzes images for civic issues only.</p>
            </div>
            <p>We do not share personal data with advertisers or 3rd party marketers.</p>
          </div>
        } />
      )}

      {showLegal === 'Terms of Service' && (
        <LegalModal title="Terms of Service" onClose={() => setShowLegal(null)} content={
          <div className="space-y-4">
            <p>By using this platform, you agree to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li className="font-medium text-gray-900">Provide accurate, real-world photos of civic issues.</li>
              <li>Not upload offensive, illegal, or non-civic related content.</li>
              <li>Respect the community upvoting system.</li>
            </ul>
          </div>
        } />
      )}

      {showLegal === 'Contact Us' && (
        <LegalModal title="Contact Us" onClose={() => setShowLegal(null)} content={
          <div className="space-y-6 text-center">
            <div className="p-6 bg-gov-50 rounded-2xl flex flex-col items-center border border-gov-100">
              <Mail className="w-10 h-10 text-gov-900 mb-4" />
              <div className="font-black text-lg">support.cleanblr@bbmp.gov.in</div>
              <div className="text-[10px] font-black text-gov-600 mt-1 uppercase tracking-widest">Official Support Email</div>
            </div>
            <div className="p-6 bg-amber-50 rounded-2xl flex flex-col items-center border border-amber-100">
              <Phone className="w-10 h-10 text-amber-600 mb-4" />
              <div className="font-black text-2xl">1533</div>
              <div className="text-[10px] font-black text-amber-600 mt-1 uppercase tracking-widest">24/7 Citizen Helpline</div>
            </div>
          </div>
        } />
      )}
    </footer>
  );
}


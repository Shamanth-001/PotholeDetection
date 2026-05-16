import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, animate } from 'framer-motion';
import { MapPin, Shield, Users, ArrowRight, CheckCircle, Building2, Mail, Phone, ExternalLink } from 'lucide-react';

function Counter({ value }) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = parseInt(value.replace(/,/g, '').replace('+', ''));

  useEffect(() => {
    const controls = animate(0, numericValue, {
      duration: 2,
      onUpdate: (v) => setDisplayValue(Math.floor(v)),
      ease: "easeOut"
    });
    return () => controls.stop();
  }, [numericValue]);

  return <span>{displayValue.toLocaleString()}{value.includes('+') ? '+' : ''}</span>;
}

export default function Landing() {
  const [showLegal, setShowLegal] = useState(null);

  const LegalModal = ({ title, content, onClose }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gov-900 text-white">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white">✕</button>
        </div>
        <div className="p-8 max-h-[60vh] overflow-y-auto text-gray-600 leading-relaxed text-sm">
          {content}
        </div>
        <div className="p-4 bg-gray-50 text-right border-t border-gray-100">
          <button onClick={onClose} className="px-6 py-2 bg-gov-900 text-white rounded-lg font-bold hover:bg-gov-800 transition-colors">I Understand</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-gov-900">Namma Clean Bengaluru</span>
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gov-900 transition-colors">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm !py-2.5">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-24 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gov-50 text-gov-900 text-sm font-bold mb-8 border border-gov-200 shadow-sm">
              <Building2 className="w-4 h-4" />
              BBMP — Official Citizen Portal
            </div>

            <h1 className="text-5xl sm:text-7xl font-extrabold text-gray-900 leading-tight mb-8 tracking-tight">
              Keep Bengaluru <br />
              <span className="text-gov-900 italic">Clean & Safe</span>
            </h1>

            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
              Report potholes and garbage issues, get AI-powered verification,
              and volunteer for community cleanup drives — all in one official platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link to="/register" className="btn-primary text-lg !px-10 !py-4 flex items-center gap-2 group shadow-xl shadow-gov-900/20">
                Start Reporting <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/login" className="btn-secondary text-lg !px-10 !py-4 bg-white border-2 border-gray-100 hover:border-gov-200">
                Explore Dashboard
              </Link>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.3 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { label: 'Issues Reported', value: '2,450+', icon: MapPin, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'AI Verified', value: '1,890+', icon: CheckCircle, color: 'text-gov-700', bg: 'bg-gov-50' },
              { label: 'Issues Resolved', value: '1,520+', icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Active Citizens', value: '8,300+', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-3xl p-8 text-center shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center mx-auto mb-4`}>
                  <s.icon className={`w-6 h-6 ${s.color}`} />
                </div>
                <div className="text-4xl font-black text-gray-900 mb-1">
                  <Counter value={s.value} />
                </div>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* How it works */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Three simple steps to make your city cleaner</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: MapPin, title: 'Report', desc: 'Snap a photo of a pothole or garbage dump. AI verifies and checks for duplicates within 10 meters.', color: 'text-red-500', bg: 'bg-red-50' },
              { icon: Shield, title: 'Verify & Prioritize', desc: 'AI classifies issues automatically. Community upvotes escalate urgency for faster resolution.', color: 'text-gov-700', bg: 'bg-gov-50' },
              { icon: Users, title: 'Volunteer & Clean', desc: 'Join BBMP-organized cleanup drives, participate in community service, and earn recognition.', color: 'text-amber-600', bg: 'bg-amber-50' },
            ].map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="gov-card gov-card-hover p-8">
                <div className={`w-14 h-14 rounded-xl ${f.bg} flex items-center justify-center mb-5`}>
                  <f.icon className={`w-7 h-7 ${f.color}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-16 bg-gov-900 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Ready to make a difference?</h2>
        <p className="text-gov-200 mb-8 max-w-md mx-auto">Join thousands of citizens building a cleaner Bengaluru</p>
        <Link to="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gov-900 font-bold rounded-lg hover:bg-gray-100 transition-colors text-lg">
          Create Free Account <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Footer / Legal Modals */}
      <footer className="bg-gray-50 pt-24 pb-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-2">
              <div className="text-4xl font-black text-gov-900 mb-6">Namma Clean Bengaluru</div>
              <p className="text-gray-500 max-w-sm mb-8 leading-relaxed font-medium">
                A collaborative initiative by the BBMP and the citizens of Bengaluru to build a cleaner, safer, and smarter city through technology.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gov-900 hover:border-gov-900 transition-all shadow-sm">
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-8 uppercase text-xs tracking-widest">Platform</h4>
              <ul className="space-y-4 text-sm font-bold text-gray-500">
                <li><button onClick={() => setShowLegal('Privacy Policy')} className="hover:text-gov-900 transition-colors">Privacy Policy</button></li>
                <li><button onClick={() => setShowLegal('Terms of Service')} className="hover:text-gov-900 transition-colors">Terms of Service</button></li>
                <li><Link to="/map" className="hover:text-gov-900 transition-colors">Live Issue Map</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-8 uppercase text-xs tracking-widest">Support</h4>
              <ul className="space-y-4 text-sm font-bold text-gray-500">
                <li><button onClick={() => setShowLegal('Contact Us')} className="hover:text-gov-900 transition-colors">Contact Support</button></li>
                <li className="flex items-center gap-2 text-gov-900 font-black"><Phone className="w-4 h-4" /> 1533</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-tighter">
            <div>© 2024 BBMP — OFFICIAL NAMMA CLEAN BENGALURU PORTAL. ALL RIGHTS RESERVED.</div>
            <div className="flex items-center gap-4">
              <span>MADE WITH ❤️ IN BENGALURU</span>
            </div>
          </div>
        </div>
      </footer>

      {showLegal === 'Privacy Policy' && (
        <LegalModal title="Privacy Policy" onClose={() => setShowLegal(null)} content={
          <div className="space-y-4">
            <p>Your privacy is paramount. Namma Clean Bengaluru collects only the data necessary to verify and address urban infrastructure issues.</p>
            <p><strong>Location Data:</strong> We access your GPS coordinates ONLY when you submit a report to pin-point the issue location.</p>
            <p><strong>Account Info:</strong> We store your name and display_name for the community leaderboard and notification system.</p>
            <p>We do not share personal data with advertisers or 3rd party marketers.</p>
          </div>
        } />
      )}

      {showLegal === 'Terms of Service' && (
        <LegalModal title="Terms of Service" onClose={() => setShowLegal(null)} content={
          <div className="space-y-4">
            <p>By using this platform, you agree to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide accurate, real-world photos of civic issues.</li>
              <li>Not upload offensive, illegal, or non-civic related content.</li>
              <li>Respect the community upvoting system.</li>
              <li>Understand that AI verification is automated and may have small errors.</li>
            </ul>
          </div>
        } />
      )}

      {showLegal === 'Contact Us' && (
        <LegalModal title="Contact Us" onClose={() => setShowLegal(null)} content={
          <div className="space-y-6 text-center">
            <div className="p-8 bg-gov-50 rounded-3xl flex flex-col items-center border border-gov-100">
              <Mail className="w-12 h-12 text-gov-900 mb-4" />
              <div className="font-black text-xl">support.cleanblr@bbmp.gov.in</div>
              <div className="text-xs font-bold text-gov-600 mt-1 uppercase tracking-widest">Official Support Email</div>
            </div>
            <div className="p-8 bg-amber-50 rounded-3xl flex flex-col items-center border border-amber-100">
              <Phone className="w-12 h-12 text-amber-600 mb-4" />
              <div className="font-black text-3xl">1533</div>
              <div className="text-xs font-bold text-amber-600 mt-1 uppercase tracking-widest">24/7 Citizen Helpline</div>
            </div>
          </div>
        } />
      )}
    </div>
  );
}


import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Shield, Users, ArrowRight, CheckCircle, Building2 } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Top bar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-gov-900">Namma Bengaluru Clean</span>
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gov-900 transition-colors">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm !py-2.5">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gov-50 text-gov-900 text-sm font-medium mb-8 border border-gov-200">
              <Building2 className="w-4 h-4" />
              BBMP — Official Citizen Portal
            </div>

            <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              Keep Bengaluru{' '}
              <span className="text-gov-900">Clean & Safe</span>
            </h1>

            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Report potholes and garbage issues, get AI-powered verification,
              and volunteer for community cleanup drives — all in one official platform.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link to="/register" className="btn-primary text-lg !px-8 !py-4 flex items-center gap-2 group">
                Start Reporting <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/login" className="btn-secondary text-lg !px-8 !py-4">
                Explore Dashboard
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { label: 'Issues Reported', value: '2,450+', icon: MapPin },
              { label: 'AI Verified', value: '1,890+', icon: CheckCircle },
              { label: 'Issues Resolved', value: '1,520+', icon: Shield },
              { label: 'Active Citizens', value: '8,300+', icon: Users },
            ].map((s, i) => (
              <div key={i} className="gov-card p-5 text-center">
                <s.icon className="w-6 h-6 text-gov-700 mx-auto mb-2" />
                <div className="text-3xl font-extrabold text-gray-900 mb-1">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
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

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gov-900">Namma Bengaluru Clean</h3>
              <p className="text-sm text-gray-500">Official Citizen Engagement Portal</p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-gray-500">
              <a href="#" className="hover:text-gov-900">Privacy Policy</a>
              <a href="#" className="hover:text-gov-900">Terms of Service</a>
              <a href="#" className="hover:text-gov-900">Contact Us</a>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-6">© 2024 Bruhat Bengaluru Mahanagara Palike (BBMP). All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}

import React from 'react';
import { X, HelpCircle, Settings, Mail, Phone, Shield, Bell, Moon, Trash2 } from 'lucide-react';

export function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gov-900 text-white">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-6 h-6" />
            <h2 className="text-xl font-bold">Help & Support</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Frequently Asked Questions</h3>
            <div className="space-y-3">
              <details className="group p-3 bg-gray-50 rounded-xl cursor-pointer">
                <summary className="font-medium text-sm text-gov-800 list-none flex justify-between items-center">
                  How do I report a pothole?
                  <span className="transition-transform group-open:rotate-180">▼</span>
                </summary>
                <p className="text-xs text-gray-600 mt-2">Simply click "New Report", snap a photo, and our AI will verify it instantly!</p>
              </details>
              <details className="group p-3 bg-gray-50 rounded-xl cursor-pointer">
                <summary className="font-medium text-sm text-gov-800 list-none flex justify-between items-center">
                  What are Impact Points?
                  <span className="transition-transform group-open:rotate-180">▼</span>
                </summary>
                <p className="text-xs text-gray-600 mt-2">You earn 10 points for new reports and 5 points for verifying duplicates. Points increase your community rank!</p>
              </details>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">Contact BBMP Support</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-[10px] text-blue-600 font-bold uppercase">Email</div>
                  <div className="text-xs font-medium">support@bbmp.gov.in</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                <Phone className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-[10px] text-green-600 font-bold uppercase">Phone</div>
                  <div className="text-xs font-medium">1533 (Citizen Help)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 bg-gray-50 text-center">
          <button onClick={onClose} className="btn-secondary w-full">Close Help</button>
        </div>
      </div>
    </div>
  );
}

export function SettingsModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-900 text-white">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6" />
            <h2 className="text-xl font-bold">Portal Settings</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gov-600" />
                <div>
                  <div className="text-sm font-bold text-gray-900">Push Notifications</div>
                  <div className="text-xs text-gray-500">Alerts for your reported issues</div>
                </div>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5 accent-gov-600" />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gov-600" />
                <div>
                  <div className="text-sm font-bold text-gray-900">Privacy Mode</div>
                  <div className="text-xs text-gray-500">Hide your name on public leaderboard</div>
                </div>
              </div>
              <input type="checkbox" className="w-5 h-5 accent-gov-600" />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl opacity-50 cursor-not-allowed">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-gov-600" />
                <div>
                  <div className="text-sm font-bold text-gray-900">Dark Mode</div>
                  <div className="text-xs text-gray-500">Coming soon in next update</div>
                </div>
              </div>
              <div className="text-[10px] font-bold bg-gray-200 px-2 py-0.5 rounded text-gray-500">BETA</div>
            </div>
          </div>
          <div className="pt-6 border-t border-gray-100">
            <button className="flex items-center gap-2 text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors text-sm font-bold">
              <Trash2 className="w-4 h-4" /> Delete Account Data
            </button>
          </div>
        </div>
        <div className="p-4 bg-gray-50 text-center">
          <button onClick={onClose} className="btn-primary w-full">Save & Exit</button>
        </div>
      </div>
    </div>
  );
}

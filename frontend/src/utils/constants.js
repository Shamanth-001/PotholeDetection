export const ISSUE_TYPES = [
  { value: 'pothole', label: 'Pothole', label_kn: 'ಗುಂಡಿ', color: '#F44336', icon: 'circle-alert' },
  { value: 'garbage', label: 'Garbage', label_kn: 'ಕಸ', color: '#FF9800', icon: 'trash-2' },
];

export const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', label_kn: 'ಬಾಕಿ ಇದೆ', color: '#FF9800' },
  { value: 'ai_verified', label: 'AI Verified', label_kn: 'AI ಪರಿಶೀಲಿಸಲಾಗಿದೆ', color: '#4CAF50' },
  { value: 'under_review', label: 'Under Review', label_kn: 'ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ', color: '#9C27B0' },
  { value: 'confirmed', label: 'Confirmed', label_kn: 'ದೃಢೀಕರಿಸಲಾಗಿದೆ', color: '#2196F3' },
  { value: 'in_progress', label: 'In Progress', label_kn: 'ಪ್ರಗತಿಯಲ್ಲಿದೆ', color: '#FF5722' },
  { value: 'volunteer_assigned', label: 'Volunteer Assigned', label_kn: 'ಸ್ವಯಂಸೇವಕರನ್ನು ನಿಯೋಜಿಸಲಾಗಿದೆ', color: '#00BCD4' },
  { value: 'resolved', label: 'Resolved', label_kn: 'ಪರಿಹರಿಸಲಾಗಿದೆ', color: '#4CAF50' },
  { value: 'closed', label: 'Closed', label_kn: 'ಮುಚ್ಚಲಾಗಿದೆ', color: '#9E9E9E' },
];

export const URGENCY_LEVELS = [
  { value: 'low', label: 'Low', label_kn: 'ಕಡಿಮೆ', color: '#4CAF50' },
  { value: 'medium', label: 'Medium', label_kn: 'ಮಧ್ಯಮ', color: '#FF9800' },
  { value: 'high', label: 'High', label_kn: 'ಹೆಚ್ಚು', color: '#F44336' },
  { value: 'critical', label: 'Critical', label_kn: 'ತೀವ್ರ', color: '#B71C1C' },
];

export const MAP_CONFIG = {
  center: [12.9716, 77.5946],  // Bangalore, India (BMSCE area)
  zoom: 13,
  tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  tileAttribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
};

export const API_URL = import.meta.env.VITE_API_URL || '/api';

export const getIssueColor = (type) => ISSUE_TYPES.find(i => i.value === type)?.color || '#9E9E9E';
export const getStatusBadge = (status) => STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
export const getUrgencyColor = (urgency) => URGENCY_LEVELS.find(u => u.value === urgency)?.color || '#FF9800';

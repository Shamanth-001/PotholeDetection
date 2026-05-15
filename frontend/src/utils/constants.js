export const ISSUE_TYPES = [
  { value: 'pothole', label: 'Pothole', color: '#F44336', icon: 'circle-alert' },
  { value: 'garbage', label: 'Garbage', color: '#FF9800', icon: 'trash-2' },
];

export const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: '#FF9800' },
  { value: 'ai_verified', label: 'AI Verified', color: '#4CAF50' },
  { value: 'under_review', label: 'Under Review', color: '#9C27B0' },
  { value: 'confirmed', label: 'Confirmed', color: '#2196F3' },
  { value: 'in_progress', label: 'In Progress', color: '#FF5722' },
  { value: 'volunteer_assigned', label: 'Volunteer Assigned', color: '#00BCD4' },
  { value: 'resolved', label: 'Resolved', color: '#4CAF50' },
  { value: 'closed', label: 'Closed', color: '#9E9E9E' },
];

export const URGENCY_LEVELS = [
  { value: 'low', label: 'Low', color: '#4CAF50' },
  { value: 'medium', label: 'Medium', color: '#FF9800' },
  { value: 'high', label: 'High', color: '#F44336' },
  { value: 'critical', label: 'Critical', color: '#B71C1C' },
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

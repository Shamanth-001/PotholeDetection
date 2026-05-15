import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useReportStore } from './store';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

// Lazy load pages that are not needed on initial render
const MapView = lazy(() => import('./pages/MapView'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const ReportIssuePage = lazy(() => import('./pages/ReportIssuePage'));
const VolunteerHub = lazy(() => import('./pages/VolunteerHub'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const Profile = lazy(() => import('./pages/Profile'));
const ReportSubmissionModal = lazy(() => import('./components/reports/ReportSubmissionModal'));
const DuplicateWarningModal = lazy(() => import('./components/reports/DuplicateWarningModal'));

function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
}

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-4 border-gov-200 border-t-gov-700 rounded-full animate-spin" />
  </div>
);

function AuthenticatedLayout({ children }) {
  const { showSubmitModal, showDuplicateModal } = useReportStore();
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Sidebar />
      <main className="ml-60 pt-16 min-h-screen flex flex-col">
        <div className="flex-1">
          <Suspense fallback={<PageLoader />}>{children}</Suspense>
        </div>
        <Footer />
      </main>
      {showSubmitModal && (
        <Suspense fallback={null}><ReportSubmissionModal /></Suspense>
      )}
      {showDuplicateModal && (
        <Suspense fallback={null}><DuplicateWarningModal /></Suspense>
      )}
    </div>
  );
}

export default function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={
        <ProtectedRoute><AuthenticatedLayout><Dashboard /></AuthenticatedLayout></ProtectedRoute>
      } />
      <Route path="/map" element={
        <ProtectedRoute><AuthenticatedLayout><MapView /></AuthenticatedLayout></ProtectedRoute>
      } />
      <Route path="/report" element={
        <ProtectedRoute><AuthenticatedLayout><ReportIssuePage /></AuthenticatedLayout></ProtectedRoute>
      } />
      <Route path="/leaderboard" element={
        <ProtectedRoute><AuthenticatedLayout><Leaderboard /></AuthenticatedLayout></ProtectedRoute>
      } />
      <Route path="/volunteer" element={
        <ProtectedRoute><AuthenticatedLayout><VolunteerHub /></AuthenticatedLayout></ProtectedRoute>
      } />
      <Route path="/admin" element={
        <ProtectedRoute adminOnly><AuthenticatedLayout><AdminPanel /></AuthenticatedLayout></ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute><AuthenticatedLayout><Profile /></AuthenticatedLayout></ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

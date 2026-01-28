import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Login from "@/pages/Login";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import TeachersManagement from "@/pages/admin/TeachersManagement";
import DevicesManagement from "@/pages/admin/DevicesManagement";
import DeviceHistory from "@/pages/admin/DeviceHistory";
import TimetableManagement from "@/pages/admin/TimetableManagement";
import TeacherDashboard from "@/pages/teacher/TeacherDashboard";
import TeacherDevices from "@/pages/teacher/TeacherDevices";
import TeacherSchedule from "@/pages/teacher/TeacherSchedule";
import NotFound from "@/pages/NotFound";
import { useEffect } from "react";

const queryClient = new QueryClient();

// Protected Route wrapper
function ProtectedRoute({ children, allowedRole }: { children: React.ReactNode; allowedRole?: 'super_admin' | 'teacher' }) {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRole && user?.role !== allowedRole) {
    return <Navigate to={user?.role === 'super_admin' ? '/admin' : '/teacher'} replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  // Redirect to main URL on page reload
  useEffect(() => {
    // Multiple methods to detect page reload (works on all devices including mobile)
    const isReload = 
      window.performance.navigation.type === 1 || 
      window.performance.getEntriesByType('navigation')[0]?.type === 'reload' ||
      sessionStorage.getItem('isReload') === 'true';
    
    // Set reload flag for next check
    sessionStorage.setItem('isReload', 'true');
    
    if (isReload && window.location.hostname !== 'localhost') {
      window.location.replace('https://keplertaptrack.vercel.app');
    }
    
    // Clear flag on page unload
    const handleUnload = () => sessionStorage.removeItem('isReload');
    window.addEventListener('beforeunload', handleUnload);
    
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          isAuthenticated 
            ? <Navigate to={user?.role === 'super_admin' ? '/admin' : '/teacher'} replace />
            : <Login />
        } 
      />
      
      {/* Redirect root to appropriate dashboard or login */}
      <Route 
        path="/" 
        element={
          isAuthenticated 
            ? <Navigate to={user?.role === 'super_admin' ? '/admin' : '/teacher'} replace />
            : <Navigate to="/login" replace />
        } 
      />
      
      {/* Admin Routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute allowedRole="super_admin">
            <DashboardLayout userRole="super_admin" />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="teachers" element={<TeachersManagement />} />
        <Route path="devices" element={<DevicesManagement />} />
        <Route path="timetable" element={<TimetableManagement />} />
        <Route path="history" element={<DeviceHistory />} />
      </Route>
      
      {/* Teacher Routes */}
      <Route 
        path="/teacher" 
        element={
          <ProtectedRoute allowedRole="teacher">
            <DashboardLayout userRole="teacher" />
          </ProtectedRoute>
        }
      >
        <Route index element={<TeacherDashboard />} />
        <Route path="devices" element={<TeacherDevices />} />
        <Route path="schedule" element={<TeacherSchedule />} />
      </Route>
      
      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DataProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </DataProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

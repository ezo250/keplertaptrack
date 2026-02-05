import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Footer from './Footer';

interface DashboardLayoutProps {
  userRole: 'super_admin' | 'teacher';
}

export default function DashboardLayout({ userRole }: DashboardLayoutProps) {
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  // Listen for localStorage changes from Sidebar component
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('sidebar-collapsed');
      setIsDesktopCollapsed(saved === 'true');
    };

    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', handleStorageChange);
    
    // Also poll for changes (since storage event doesn't fire in same window)
    const interval = setInterval(handleStorageChange, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar userRole={userRole} />
      <main 
        className="flex-1 flex flex-col transition-all duration-300"
        style={{
          marginLeft: window.innerWidth >= 1024 ? (isDesktopCollapsed ? '0' : '16rem') : '0'
        }}
      >
        <Outlet />
        <Footer />
      </main>
    </div>
  );
}

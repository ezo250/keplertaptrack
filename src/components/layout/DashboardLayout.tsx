import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Footer from './Footer';

interface DashboardLayoutProps {
  userRole: 'super_admin' | 'teacher';
}

export default function DashboardLayout({ userRole }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Sidebar userRole={userRole} />
      <main className="ml-64 flex-1 flex flex-col">
        <Outlet />
        <Footer />
      </main>
    </div>
  );
}

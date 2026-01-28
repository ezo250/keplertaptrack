import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import AdminSettingsModal from '@/components/modals/AdminSettingsModal';
import { 
  LayoutDashboard, 
  Users, 
  Tablet, 
  Calendar, 
  Bell, 
  LogOut,
  Settings,
  History,
  Home,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';


interface SidebarProps {
  userRole: 'super_admin' | 'teacher';
}

export default function Sidebar({ userRole }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const adminLinks = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/teachers', icon: Users, label: 'Teachers' },
    { to: '/admin/devices', icon: Tablet, label: 'Devices' },
    { to: '/admin/timetable', icon: Calendar, label: 'Timetable' },
    { to: '/admin/history', icon: History, label: 'History' },
  ];

  const teacherLinks = [
    { to: '/teacher', icon: Home, label: 'Dashboard' },
    { to: '/teacher/devices', icon: Tablet, label: 'Devices' },
    { to: '/teacher/schedule', icon: Calendar, label: 'My Schedule' },
  ];

  const links = userRole === 'super_admin' ? adminLinks : teacherLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-background border border-border shadow-lg"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobileMenu}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ 
          x: isMobileMenuOpen ? 0 : (window.innerWidth >= 1024 ? 0 : -280)
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed left-0 top-0 h-screen w-64 bg-sidebar flex flex-col z-50 lg:translate-x-0"
      >
        {/* Mobile Close Button */}
        <button
          onClick={closeMobileMenu}
          className="lg:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-sidebar-accent/50"
        >
          <X className="w-5 h-5 text-sidebar-foreground" />
        </button>

        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <Link 
            to={userRole === 'super_admin' ? '/admin' : '/teacher'} 
            className="flex items-center gap-3"
            onClick={closeMobileMenu}
          >
            <img 
              src="/kepler-logo.png" 
              alt="Kepler" 
              className="h-14 w-auto"
              onError={(e) => {
                console.log('Logo failed to load');
                e.currentTarget.style.display = 'none';
              }}
              onLoad={() => console.log('Logo loaded successfully')}
            />
            <div>
              <span className="font-heading font-bold text-sidebar-foreground text-lg">TapTrack</span>
              <p className="text-xs text-sidebar-foreground/60">Device Manager</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={closeMobileMenu}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                )}
              >
                <link.icon className={cn(
                  'w-5 h-5 transition-transform duration-200',
                  isActive ? 'scale-110' : 'group-hover:scale-105'
                )} />
                <span className="font-medium">{link.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-sm font-semibold text-sidebar-accent-foreground">
                {user?.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{userRole.replace('_', ' ')}</p>
            </div>
          </div>
          
          {userRole === 'super_admin' && (
            <button
              onClick={() => {
                setShowSettings(true);
                closeMobileMenu();
              }}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all duration-200 mb-1"
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </button>
          )}
          
          <button
            onClick={() => {
              handleLogout();
              closeMobileMenu();
            }}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-white transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>

        {/* Admin Settings Modal */}
        {userRole === 'super_admin' && (
          <AdminSettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
      </motion.aside>
    </>
  );
}

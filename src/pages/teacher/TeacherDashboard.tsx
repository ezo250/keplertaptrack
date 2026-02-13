import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import Header from '@/components/layout/Header';
import StatCard from '@/components/dashboard/StatCard';
import DeviceCard from '@/components/dashboard/DeviceCard';
import PickupSuccessModal from '@/components/modals/PickupSuccessModal';
import ReturnSuccessModal from '@/components/modals/ReturnSuccessModal';
import ChangePasswordModal from '@/components/modals/ChangePasswordModal';
import DeviceRestrictionModal from '@/components/modals/DeviceRestrictionModal';
import QRScanner from '@/components/teacher/QRScanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { 
  Tablet, 
  Calendar, 
  Clock, 
  ArrowUp, 
  ArrowDown,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Key,
  MapPin,
  GraduationCap,
  RefreshCw,
  QrCode,
  Search
} from 'lucide-react';
import { Device } from '@/types';
import { qrCodeAPI } from '@/services/api';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { 
    devices, 
    timetable, 
    getAvailableDevices, 
    getUserDevices,
    pickupDevice,
    returnDevice
  } = useData();

  const [isPickupDialogOpen, setIsPickupDialogOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showPickupSuccess, setShowPickupSuccess] = useState(false);
  const [showReturnSuccess, setShowReturnSuccess] = useState(false);
  const [lastActionDevice, setLastActionDevice] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [qrScanMode, setQrScanMode] = useState<'pickup' | 'return'>('pickup');
  const [qrError, setQrError] = useState('');
  const [isVerifyingQR, setIsVerifyingQR] = useState(false);
  const [deviceSearchQuery, setDeviceSearchQuery] = useState('');

  const isCodeValidForMode = (code: string, mode: 'pickup' | 'return') => {
    if (!code) return false;
    const upper = code.toUpperCase();
    return mode === 'pickup'
      ? upper.startsWith('KEPLER_PICKUP_AUTH_')
      : upper.startsWith('KEPLER_RETURN_AUTH_');
  };

  const availableDevices = getAvailableDevices();
  const myDevices = getUserDevices(user?.id || '');
  const mySchedule = timetable.filter(t => t.teacherId === user?.id);
  const hasOverdueDevice = myDevices.some(d => d.status === 'overdue');

  // Filter available devices based on search query
  const filteredAvailableDevices = availableDevices.filter(d =>
    d.deviceId.toLowerCase().includes(deviceSearchQuery.toLowerCase())
  );
  
  // Get current day
  const currentDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todaySchedule = mySchedule.filter(t => t.day === currentDay);

  const handlePickupClick = (device: Device) => {
    if (!user) return;
    
    // Prevent picking up if teacher already has a device
    if (myDevices.length > 0) {
      setShowRestrictionModal(true);
      return;
    }
    
    // Store the selected device and open QR scanner
    setSelectedDevice(device);
    setQrScanMode('pickup');
    setQrError('');
    setIsPickupDialogOpen(false);
    setIsQRScannerOpen(true);
  };

  const handleReturnClick = (device: Device) => {
    if (!user) return;
    
    // Store the selected device and open QR scanner
    setSelectedDevice(device);
    setQrScanMode('return');
    setQrError('');
    setIsReturnDialogOpen(false);
    setIsQRScannerOpen(true);
  };

  const handleQRScan = async (scannedCode: string) => {
    console.log('[TeacherDashboard] QR code scanned:', scannedCode);
    
    if (!selectedDevice || !user) {
      console.error('[TeacherDashboard] Missing selectedDevice or user');
      setQrError('Session error. Please try again.');
      setIsQRScannerOpen(false);
      return;
    }

    // Immediately close scanner and show feedback for instant response
    setIsQRScannerOpen(false);
    setIsVerifyingQR(true);
    setQrError('');

    // Store device info for success modal
    const deviceId = selectedDevice.deviceId;
    const deviceDbId = selectedDevice.id;
    const mode = qrScanMode;
    
    console.log('[TeacherDashboard] Processing', mode, 'for device:', deviceId);
    
    // Clear selected device immediately
    setSelectedDevice(null);

    try {
      // Simplified flow: validate QR code, then execute action once
      let isValidQR = false;
      
      // Try to validate with server first
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 5000)
        );

        console.log('[TeacherDashboard] Fetching active QR code from API...');
        
        const activeQRCode = await Promise.race([
          qrCodeAPI.getActive(mode),
          timeoutPromise
        ]) as any;
        
        console.log('[TeacherDashboard] Active QR code received:', activeQRCode);
        
        // Verify the scanned code matches the active QR code
        if (activeQRCode && activeQRCode.code === scannedCode) {
          // Check if QR code is still valid
          if (activeQRCode.validUntil) {
            const validUntil = new Date(activeQRCode.validUntil);
            if (validUntil < new Date()) {
              console.error('[TeacherDashboard] QR code expired');
              setQrError('QR code has expired. Please contact admin for a new code.');
              setIsVerifyingQR(false);
              return;
            }
          }
          isValidQR = true;
        }
      } catch (error: any) {
        console.warn('[TeacherDashboard] Server validation failed:', error.message);
        // Will fall back to client-side validation
      }
      
      // Fallback to client-side validation if server validation failed
      if (!isValidQR && isCodeValidForMode(scannedCode, mode)) {
        console.warn('[TeacherDashboard] Using client-side validation');
        isValidQR = true;
      }
      
      // If validation failed, show error
      if (!isValidQR) {
        setQrError('Invalid QR code. Please scan the correct QR code for ' + mode + '.');
        setIsVerifyingQR(false);
        return;
      }
      
      // Execute the action ONCE
      console.log('[TeacherDashboard] QR code validated, executing action');
      if (mode === 'pickup') {
        await pickupDevice(deviceDbId, user.id, user.name);
        setLastActionDevice(deviceId);
        setIsVerifyingQR(false);
        setShowPickupSuccess(true);
      } else {
        await returnDevice(deviceDbId, user.id, user.name);
        setLastActionDevice(deviceId);
        setIsVerifyingQR(false);
        setShowReturnSuccess(true);
      }
    } catch (error: any) {
      console.error('[TeacherDashboard] Error during QR scan process:', error);
      setIsVerifyingQR(false);
      setQrError(error.message || 'Failed to complete action. Please try again.');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Force re-fetch data by triggering a re-render
      // This will cause useData hook to fetch fresh data
      window.dispatchEvent(new Event('focus'));
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header 
        title={`Hello, ${user?.name?.split(' ')[0]}!`}
        subtitle="Manage your attendance devices here"
      />
      
      {/* Quick Settings Bar - Mobile Optimized */}
      <div className="px-4 sm:px-6 pt-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center gap-3"
        >
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="gap-2 h-11 sm:h-9 px-4 sm:px-3 text-sm sm:text-sm flex-1 sm:flex-none"
          >
            <RefreshCw className={`w-5 h-5 sm:w-4 sm:h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="sm:inline">Refresh</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowChangePassword(true)}
            className="gap-2 h-11 sm:h-9 px-4 sm:px-3 text-sm sm:text-sm flex-1 sm:flex-none"
          >
            <Key className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Password</span>
            <span className="sm:hidden">Change Password</span>
          </Button>
        </motion.div>
      </div>
      
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (myDevices.length > 0) {
                setShowRestrictionModal(true);
              } else {
                setIsPickupDialogOpen(true);
              }
            }}
            disabled={myDevices.length > 0}
            className={`relative p-6 sm:p-6 min-h-[120px] sm:min-h-0 rounded-xl overflow-hidden group ${
              myDevices.length > 0
                ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                : 'bg-gradient-to-br from-primary to-primary/80 text-white active:scale-95'
            }`}
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
            
            <div className="relative flex items-center gap-4 sm:gap-4">
              <div className="w-16 h-16 sm:w-14 sm:h-14 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <ArrowUp className="w-8 h-8 sm:w-7 sm:h-7" />
              </div>
              <div className="text-left">
                <h3 className="text-lg sm:text-base font-heading font-bold">Pick Up Device</h3>
                <p className={`text-sm sm:text-xs mt-1 ${
                  myDevices.length > 0 ? 'text-muted-foreground' : 'text-white/80'
                }`}>
                  {myDevices.length > 0 
                    ? 'Return current device first' 
                    : `${availableDevices.length} devices available`}
                </p>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsReturnDialogOpen(true)}
            disabled={myDevices.length === 0}
            className={`relative p-6 sm:p-6 min-h-[120px] sm:min-h-0 rounded-xl overflow-hidden group ${
              myDevices.length > 0
                ? 'bg-gradient-to-br from-secondary to-secondary/80 text-white active:scale-95'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
            
            <div className="relative flex items-center gap-4 sm:gap-4">
              <div className={`w-16 h-16 sm:w-14 sm:h-14 rounded-xl ${myDevices.length > 0 ? 'bg-white/20' : 'bg-muted-foreground/10'} flex items-center justify-center flex-shrink-0`}>
                <ArrowDown className="w-8 h-8 sm:w-7 sm:h-7" />
              </div>
              <div className="text-left">
                <h3 className="text-lg sm:text-base font-heading font-bold">Return Device</h3>
                <p className={`text-sm sm:text-xs mt-1 ${myDevices.length > 0 ? 'text-white/80' : ''}`}>
                  {myDevices.length > 0 
                    ? `${myDevices.length} device(s) with you` 
                    : 'No devices to return'}
                </p>
              </div>
            </div>
          </motion.button>
        </motion.div>

        {/* My Devices Alert */}
        {myDevices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`${
              hasOverdueDevice 
                ? 'bg-destructive/10 border-destructive/30' 
                : 'bg-primary/5 border-primary/20'
            } border rounded-xl p-4 flex items-start gap-4`}
          >
            <div className={`w-10 h-10 rounded-full ${
              hasOverdueDevice 
                ? 'bg-destructive/20 animate-pulse' 
                : 'bg-primary/10'
            } flex items-center justify-center flex-shrink-0`}>
              <AlertCircle className={`w-5 h-5 ${
                hasOverdueDevice ? 'text-destructive' : 'text-primary'
              }`} />
            </div>
            <div>
              <h4 className={`font-semibold ${
                hasOverdueDevice ? 'text-destructive' : 'text-foreground'
              }`}>
                {hasOverdueDevice ? '⚠️ Device Overdue!' : `You have ${myDevices.length} device(s)`}
              </h4>
              <p className="text-sm text-muted-foreground mt-1">
                {hasOverdueDevice 
                  ? 'Your class has ended. Please return the device immediately to avoid penalties.' 
                  : 'Remember to return them after your class so other teachers can use them.'}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {myDevices.map(device => (
                  <span 
                    key={device.id} 
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                      device.status === 'overdue'
                        ? 'bg-destructive/20 text-destructive border border-destructive/30 animate-pulse'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    <Tablet className="w-4 h-4" />
                    {device.deviceId}
                    {device.status === 'overdue' && (
                      <span className="ml-1 text-xs font-bold">OVERDUE</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <StatCard
            title="Available Devices"
            value={availableDevices.length}
            subtitle="At pickup station"
            icon={Tablet}
            variant="secondary"
            delay={0.1}
          />
          <StatCard
            title="My Classes Today"
            value={todaySchedule.length}
            subtitle="Scheduled classes"
            icon={Calendar}
            delay={0.2}
          />
          <StatCard
            title="Devices With Me"
            value={myDevices.length}
            subtitle={hasOverdueDevice ? '⚠️ Overdue - Return now!' : myDevices.length > 0 ? 'Remember to return' : 'All clear!'}
            icon={hasOverdueDevice ? AlertTriangle : myDevices.length > 0 ? Clock : CheckCircle}
            variant={hasOverdueDevice ? 'destructive' : myDevices.length > 0 ? 'warning' : 'default'}
            delay={0.3}
          />
        </div>

        {/* Today's Classes Card */}
        {todaySchedule.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-4"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-heading font-semibold text-foreground">{currentDay}</h2>
                <p className="text-xs text-muted-foreground">
                  {todaySchedule.length} {todaySchedule.length === 1 ? 'class' : 'classes'} today
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {todaySchedule.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((classItem, index) => (
                <motion.div
                  key={classItem.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="bg-card rounded-lg border border-border/50 p-3 space-y-2.5"
                >
                  {/* Time */}
                  <div className="flex items-center gap-2 text-foreground">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">
                      {classItem.startTime} to {classItem.endTime}
                    </span>
                  </div>

                  {/* Course */}
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    <span className="text-sm sm:text-base font-heading font-bold text-foreground">
                      {classItem.course}
                    </span>
                  </div>

                  {/* Classroom */}
                  {classItem.classroom && (
                    <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-2.5 py-1.5 w-fit">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-primary">
                        {classItem.classroom}
                      </span>
                    </div>
                  )}

                  {/* Reminder */}
                  {myDevices.length === 0 && (
                    <div className="flex items-start gap-2 mt-2 p-2.5 bg-orange-50 border border-orange-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-orange-900 font-medium">
                        Don't forget to pick up a device!
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* My Schedule - Redesigned Compact & Mobile-Friendly */}
        {mySchedule.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2.5 px-1">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
                <Calendar className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-heading font-bold text-foreground">
                  My Teaching Schedule
                </h2>
                <p className="text-xs text-muted-foreground">Your weekly classes</p>
              </div>
            </div>

            <div className="space-y-3">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, dayIndex) => {
                const dayClasses = mySchedule.filter(t => t.day === day);
                if (dayClasses.length === 0) return null;

                const isToday = day === currentDay;

                return (
                  <motion.div 
                    key={day} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + dayIndex * 0.1 }}
                    className="space-y-2"
                  >
                    {/* Day Header - Compact */}
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-bold ${isToday ? 'text-primary' : 'text-foreground/80'}`}>
                          {day}
                        </h3>
                        {isToday && (
                          <span className="text-xs px-1.5 py-0.5 rounded-md bg-primary text-white font-semibold">
                            Today
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {dayClasses.length} {dayClasses.length === 1 ? 'class' : 'classes'}
                      </span>
                    </div>

                    {/* Classes Grid - Mobile Responsive */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {dayClasses.sort((a, b) => a.startTime.localeCompare(b.startTime)).map((classItem, index) => {
                        // Check if class is happening now
                        const now = new Date();
                        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                        const isHappeningNow = isToday && currentTime >= classItem.startTime && currentTime <= classItem.endTime;
                        const isUpcoming = isToday && currentTime < classItem.startTime;
                        const isPast = isToday && currentTime > classItem.endTime;
                        
                        return (
                          <motion.div
                            key={classItem.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 + dayIndex * 0.1 + index * 0.05 }}
                            className={`relative rounded-lg border p-3 transition-all duration-200 group ${
                              isHappeningNow
                                ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary shadow-sm ring-1 ring-primary/20'
                                : isUpcoming
                                ? 'bg-card border-border/60 hover:border-primary/40 hover:shadow-sm'
                                : isPast
                                ? 'bg-muted/40 border-border/30 opacity-60'
                                : 'bg-card border-border/60 hover:border-primary/40 hover:shadow-sm'
                            }`}
                          >
                            {/* Status Indicator - Top Right */}
                            {isHappeningNow && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary animate-pulse shadow-lg">
                                <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
                              </div>
                            )}
                            
                            {/* Time Badge */}
                            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md mb-2 ${
                              isHappeningNow
                                ? 'bg-primary/20 text-primary'
                                : isUpcoming
                                ? 'bg-secondary/15 text-secondary'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              <Clock className="w-3 h-3" />
                              <span className="text-xs font-semibold">
                                {classItem.startTime}
                              </span>
                            </div>

                            {/* Course Name - Prominent */}
                            <h4 className="text-sm font-heading font-bold text-foreground mb-2 leading-tight line-clamp-2">
                              {classItem.course}
                            </h4>

                            {/* Classroom Badge */}
                            {classItem.classroom && (
                              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gradient-to-r from-primary/10 to-primary/5 w-fit">
                                <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                                <span className="text-xs font-bold text-primary">
                                  {classItem.classroom}
                                </span>
                              </div>
                            )}

                            {/* Status Label - Bottom */}
                            {isToday && (
                              <div className="mt-2 pt-2 border-t border-border/50">
                                {isHappeningNow ? (
                                  <span className="text-xs font-semibold text-primary flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    In Progress
                                  </span>
                                ) : isUpcoming ? (
                                  <span className="text-xs font-medium text-secondary">
                                    Starting soon
                                  </span>
                                ) : (
                                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Completed
                                  </span>
                                )}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Available Devices Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-xl border border-border/50 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-heading font-semibold text-foreground">Available at Pickup Station</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Click on a device to pick it up</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableDevices.slice(0, 8).map((device, index) => (
              <DeviceCard 
                key={device.id} 
                device={device}
                onClick={() => {
                  setSelectedDevice(device);
                  setIsPickupDialogOpen(true);
                }}
                delay={0.5 + index * 0.05}
              />
            ))}
          </div>
          
          {availableDevices.length === 0 && (
            <div className="text-center py-12">
              <Tablet className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No devices available at the moment</p>
              <p className="text-sm text-muted-foreground mt-1">Check back later or contact admin</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Pickup Dialog - Mobile Optimized */}
      <Dialog open={isPickupDialogOpen} onOpenChange={(open) => {
        setIsPickupDialogOpen(open);
        if (!open) setDeviceSearchQuery('');
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg w-full p-4 sm:p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <ArrowUp className="w-6 h-6 sm:w-5 sm:h-5 text-primary" />
              Pick Up Device
            </DialogTitle>
            <DialogDescription className="text-base sm:text-sm">
              Select a device to pick up. You'll need to scan a QR code for authorization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search devices..."
                value={deviceSearchQuery}
                onChange={(e) => setDeviceSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[400px] sm:max-h-[300px] overflow-y-auto">
              {filteredAvailableDevices.length === 0 ? (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  {deviceSearchQuery ? `No devices found matching "${deviceSearchQuery}"` : 'No available devices'}
                </div>
              ) : (
                filteredAvailableDevices.map((device) => (
                  <motion.button
                    key={device.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handlePickupClick(device)}
                    className="p-5 sm:p-4 rounded-lg border-2 sm:border border-border hover:border-primary hover:bg-primary/5 active:bg-primary/10 transition-all text-left"
                  >
                    <div className="flex items-center gap-4 sm:gap-3">
                      <div className="w-14 h-14 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Tablet className="w-7 h-7 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-base sm:text-sm">{device.deviceId}</p>
                        <p className="text-sm sm:text-xs text-success font-medium">Available</p>
                      </div>
                    </div>
                  </motion.button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Return Dialog - Mobile Optimized */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg w-full p-4 sm:p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <ArrowDown className="w-6 h-6 sm:w-5 sm:h-5 text-secondary" />
              Return Device
            </DialogTitle>
            <DialogDescription className="text-base sm:text-sm">
              Select the device you want to return. You'll need to scan a QR code for authorization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {myDevices.map((device) => (
                <motion.button
                  key={device.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleReturnClick(device)}
                  className="p-5 sm:p-4 rounded-lg border-2 sm:border border-border hover:border-secondary hover:bg-secondary/5 active:bg-secondary/10 transition-all text-left"
                >
                  <div className="flex items-center gap-4 sm:gap-3">
                    <div className="w-14 h-14 sm:w-10 sm:h-10 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <Tablet className="w-7 h-7 sm:w-5 sm:h-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-semibold text-base sm:text-sm">{device.deviceId}</p>
                      <p className="text-sm sm:text-xs text-primary font-medium">With you</p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={isQRScannerOpen}
        onClose={() => {
          setIsQRScannerOpen(false);
          setSelectedDevice(null);
          setQrError('');
        }}
        onScan={handleQRScan}
        title={qrScanMode === 'pickup' ? 'Scan QR Code for Pickup' : 'Scan QR Code for Return'}
      />

      {/* Verifying QR Dialog - Mobile Optimized */}
      <Dialog open={isVerifyingQR} onOpenChange={() => {}}>
        <DialogContent className="max-w-[90vw] sm:max-w-md w-full p-6 sm:p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center justify-center gap-2 text-lg sm:text-base">
              <RefreshCw className="w-6 h-6 sm:w-5 sm:h-5 animate-spin text-primary" />
              Verifying Authorization
            </DialogTitle>
            <DialogDescription>
              Please wait while we verify your QR authorization.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 sm:space-y-4 pt-4">
            <div className="flex flex-col items-center gap-6 sm:gap-4">
              <div className="w-20 h-20 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <QrCode className="w-10 h-10 sm:w-8 sm:h-8 text-primary animate-pulse" />
              </div>
              <p className="text-center text-muted-foreground text-base sm:text-sm font-medium">
                Processing your request...
              </p>
              <div className="w-full bg-muted rounded-full h-3 sm:h-2 overflow-hidden">
                <div className="h-full bg-primary rounded-full animate-pulse transition-all" style={{ width: '70%' }} />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Error Dialog - Mobile Optimized */}
      <Dialog open={!!qrError} onOpenChange={(open) => !open && setQrError('')}>
        <DialogContent className="max-w-[95vw] sm:max-w-md w-full p-6 sm:p-6">
          <DialogHeader className="space-y-2">
            <DialogTitle className="flex items-center gap-2 text-destructive text-lg sm:text-base">
              <AlertCircle className="w-6 h-6 sm:w-5 sm:h-5" />
              Authorization Failed
            </DialogTitle>
            <DialogDescription>
              We could not verify your QR code. See details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 sm:space-y-4 pt-4">
            <p className="text-muted-foreground text-base sm:text-sm">{qrError}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setQrError('');
                  setIsQRScannerOpen(false);
                  setSelectedDevice(null);
                }}
                className="flex-1 h-12 sm:h-10 text-base sm:text-sm font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setQrError('');
                  setIsQRScannerOpen(true);
                }}
                className="flex-1 h-12 sm:h-10 text-base sm:text-sm font-semibold"
              >
                Try Again
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modals */}
      <PickupSuccessModal 
        isOpen={showPickupSuccess}
        onClose={() => setShowPickupSuccess(false)}
        deviceId={lastActionDevice}
      />
      
      <ReturnSuccessModal
        isOpen={showReturnSuccess}
        onClose={() => setShowReturnSuccess(false)}
        deviceId={lastActionDevice}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        userId={user?.id || ''}
      />
      
      {/* Device Restriction Modal */}
      <DeviceRestrictionModal
        isOpen={showRestrictionModal}
        onClose={() => setShowRestrictionModal(false)}
        currentDeviceId={myDevices[0]?.deviceId}
      />
    </div>
  );
}

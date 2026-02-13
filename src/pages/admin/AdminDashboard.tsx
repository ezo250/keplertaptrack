import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import Header from '@/components/layout/Header';
import StatCard from '@/components/dashboard/StatCard';
import DeviceCard from '@/components/dashboard/DeviceCard';
import QRCodeManagement from '@/components/admin/QRCodeManagement';
import TimetableUpload from '@/components/admin/TimetableUpload';
import DeviceStatisticsCards from '@/components/admin/DeviceStatisticsCards';
import { Tablet, Users, CheckCircle, AlertTriangle, Clock, ArrowRight, QrCode, Upload, BarChart3, RefreshCw, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { QRCodeType as QRType } from '@/types';
import { historyAPI } from '@/services/api';
import { useQueryClient } from '@tanstack/react-query';

export default function AdminDashboard() {
  const { devices, teachers, timetable, getAvailableDevices, getDevicesInUse, getOverdueDevices, deviceHistory, addTimetableEntry } = useData();
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const availableCount = getAvailableDevices().length;
  const inUseCount = getDevicesInUse().length;
  const overdueCount = getOverdueDevices().length;

  // Filter devices based on search query
  const filteredDevices = devices.filter(d =>
    d.deviceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.currentUserName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get recent activity
  const recentActivity = deviceHistory
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  // Handle QR code generation
  const handleGenerateQRCode = async (type: QRType, validUntil?: string) => {
    // In a real app, this would call the backend API
    console.log('Generating QR code:', type, validUntil);
  };

  // Handle timetable upload
  const handleTimetableUpload = async (entries: Array<{
    teacherId?: string;
    teacherName: string;
    course: string;
    classroom?: string;
    day: string;
    startTime: string;
    endTime: string;
  }>) => {
    for (const entry of entries) {
      if (entry.teacherId) {
        await addTimetableEntry({
          teacherId: entry.teacherId,
          teacherName: entry.teacherName,
          course: entry.course,
          classroom: entry.classroom,
          day: entry.day as 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday',
          startTime: entry.startTime,
          endTime: entry.endTime,
        });
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Trigger data refetch
      window.dispatchEvent(new Event('focus'));
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCleanupDuplicates = async () => {
    setIsCleaningUp(true);
    try {
      const result = await historyAPI.cleanupDuplicates();
      toast.success(result.message || 'Duplicates cleaned up successfully');
      
      // Refresh the history data
      queryClient.invalidateQueries({ queryKey: ['deviceHistory'] });
    } catch (error: any) {
      toast.error(error.message || 'Failed to cleanup duplicates');
    } finally {
      setIsCleaningUp(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header 
        title="Dashboard" 
        subtitle="Welcome back! Here's an overview of your device tracking system."
      />
      
      {/* Refresh Button */}
      <div className="px-4 sm:px-6 pt-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-start"
        >
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh Data</span>
          </Button>
        </motion.div>
      </div>
      
      <div className="p-4 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview" className="gap-1 sm:gap-2">
              <Tablet className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="qr-codes" className="gap-1 sm:gap-2">
              <QrCode className="w-4 h-4" />
              <span className="text-xs sm:text-sm">QR Codes</span>
            </TabsTrigger>
            <TabsTrigger value="timetable-upload" className="gap-1 sm:gap-2">
              <Upload className="w-4 h-4" />
              <span className="text-xs sm:text-sm hidden sm:inline">Upload</span>
              <span className="text-xs sm:hidden">Upload</span>
            </TabsTrigger>
            <TabsTrigger value="device-planning" className="gap-1 sm:gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs sm:text-sm hidden sm:inline">Planning</span>
              <span className="text-xs sm:hidden">Stats</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <StatCard
                title="Total Devices"
                value={devices.length}
                subtitle="All registered devices"
                icon={Tablet}
                variant="primary"
                delay={0}
              />
              <StatCard
                title="Available"
                value={availableCount}
                subtitle="Ready for pickup"
                icon={CheckCircle}
                variant="secondary"
                delay={0.1}
              />
              <StatCard
                title="In Use"
                value={inUseCount}
                subtitle="Currently with teachers"
                icon={Clock}
                delay={0.2}
              />
              <StatCard
                title="Overdue"
                value={overdueCount}
                subtitle="Need attention"
                icon={AlertTriangle}
                variant={overdueCount > 0 ? 'destructive' : 'default'}
                delay={0.3}
              />
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <StatCard
                title="Active Teachers"
                value={teachers.length}
                subtitle="Registered in system"
                icon={Users}
                delay={0.4}
              />
            </div>

            {/* Device Overview & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Devices Overview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="lg:col-span-2 bg-card rounded-xl border border-border/50 p-6"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-heading font-semibold text-foreground">Devices Overview</h2>
                    <p className="text-sm text-muted-foreground">Current status of all devices</p>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search devices..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-9"
                      />
                    </div>
                    <Link to="/admin/devices">
                      <Button variant="outline" size="sm">
                        View All <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                  {filteredDevices.slice(0, 6).map((device, index) => (
                    <DeviceCard 
                      key={device.id} 
                      device={device} 
                      delay={0.6 + index * 0.05}
                    />
                  ))}
                  {filteredDevices.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No devices found matching "{searchQuery}"
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-card rounded-xl border border-border/50 p-6"
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-heading font-semibold text-foreground mb-1">Recent Activity</h2>
                    <p className="text-sm text-muted-foreground">Latest device actions</p>
                  </div>
                  <Button
                    onClick={handleCleanupDuplicates}
                    disabled={isCleaningUp}
                    variant="outline"
                    size="sm"
                    className="gap-2 text-orange-600 hover:text-orange-700 border-orange-300 hover:border-orange-400"
                    title="Remove duplicate entries"
                  >
                    <Trash2 className={`w-4 h-4 ${isCleaningUp ? 'animate-pulse' : ''}`} />
                    <span className="hidden sm:inline">Clean</span>
                  </Button>
                </div>
                
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {recentActivity.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No recent activity</p>
                    ) : (
                      recentActivity.map((activity, index) => (
                        <motion.div
                          key={`${activity.id}-${activity.timestamp}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + index * 0.1 }}
                          className="flex items-start gap-3 pb-4 border-b border-border/50 last:border-0 last:pb-0"
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            activity.action === 'pickup' 
                              ? 'bg-primary/10 text-primary' 
                              : 'bg-success/10 text-success'
                          }`}>
                            {activity.action === 'pickup' ? '↑' : '↓'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {activity.userName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {activity.action === 'pickup' ? 'Picked up' : 'Returned'}{' '}
                              <span className="font-medium">
                                {devices.find(d => d.id === activity.deviceId)?.deviceId || activity.deviceId}
                              </span>
                            </p>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="qr-codes">
            <QRCodeManagement onGenerateQRCode={handleGenerateQRCode} />
          </TabsContent>

          <TabsContent value="timetable-upload">
            <TimetableUpload teachers={teachers} onUploadComplete={handleTimetableUpload} />
          </TabsContent>

          <TabsContent value="device-planning">
            <DeviceStatisticsCards timetable={timetable} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

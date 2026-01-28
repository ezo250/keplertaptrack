import React from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import Header from '@/components/layout/Header';
import StatCard from '@/components/dashboard/StatCard';
import DeviceCard from '@/components/dashboard/DeviceCard';
import { Tablet, Users, CheckCircle, AlertTriangle, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { devices, teachers, getAvailableDevices, getDevicesInUse, getOverdueDevices, deviceHistory } = useData();

  const availableCount = getAvailableDevices().length;
  const inUseCount = getDevicesInUse().length;
  const overdueCount = getOverdueDevices().length;

  // Get recent activity
  const recentActivity = deviceHistory
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen">
      <Header 
        title="Dashboard" 
        subtitle="Welcome back! Here's an overview of your device tracking system."
      />
      
      <div className="p-6 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <StatCard
            title="Active Teachers"
            value={teachers.length}
            subtitle="Registered in system"
            icon={Users}
            delay={0.4}
          />
        </div>

        {/* Device Overview & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Devices Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 bg-card rounded-xl border border-border/50 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-heading font-semibold text-foreground">Devices Overview</h2>
                <p className="text-sm text-muted-foreground">Current status of all devices</p>
              </div>
              <Link to="/admin/devices">
                <Button variant="outline" size="sm">
                  View All <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices.slice(0, 6).map((device, index) => (
                <DeviceCard 
                  key={device.id} 
                  device={device} 
                  delay={0.6 + index * 0.05}
                />
              ))}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-card rounded-xl border border-border/50 p-6"
          >
            <h2 className="text-xl font-heading font-semibold text-foreground mb-1">Recent Activity</h2>
            <p className="text-sm text-muted-foreground mb-6">Latest device actions</p>
            
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No recent activity</p>
              ) : (
                recentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id}
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
          </motion.div>
        </div>
      </div>
    </div>
  );
}

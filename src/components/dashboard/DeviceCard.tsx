import React from 'react';
import { motion } from 'framer-motion';
import { Device } from '@/types';
import { Tablet, Clock, User, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface DeviceCardProps {
  device: Device;
  onClick?: () => void;
  showActions?: boolean;
  delay?: number;
}

export default function DeviceCard({ device, onClick, showActions = false, delay = 0 }: DeviceCardProps) {
  const statusConfig = {
    available: {
      label: 'Available',
      color: 'bg-success/10 text-success border-success/20',
      icon: CheckCircle,
      bgGlow: 'shadow-success/10',
    },
    in_use: {
      label: 'In Use',
      color: 'bg-primary/10 text-primary border-primary/20',
      icon: User,
      bgGlow: 'shadow-primary/10',
    },
    overdue: {
      label: 'Overdue',
      color: 'bg-destructive/10 text-destructive border-destructive/20',
      icon: AlertTriangle,
      bgGlow: 'shadow-destructive/10',
    },
  };

  const config = statusConfig[device.status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={cn(
        'relative p-6 rounded-xl bg-card border-2 border-border/50 cursor-pointer transition-all duration-300',
        'hover:shadow-xl',
        config.bgGlow,
        onClick && 'hover:border-primary/30'
      )}
    >
      <div className="flex items-start justify-between mb-5">
        <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center">
          <Tablet className="w-8 h-8 text-primary" />
        </div>
        <div className={cn(
          'flex items-center gap-2 px-3.5 py-1.5 rounded-full text-sm font-semibold border-2',
          config.color
        )}>
          <StatusIcon className="w-4 h-4" />
          {config.label}
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-foreground mb-3">{device.deviceId}</h3>
      
      {device.status === 'available' ? (
        <p className="text-base text-muted-foreground font-medium">
          Ready for pickup
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-base text-foreground flex items-center gap-2 font-medium">
            <User className="w-5 h-5 text-muted-foreground" />
            {device.currentUserName}
          </p>
          {device.pickedUpAt && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {formatDistanceToNow(new Date(device.pickedUpAt), { addSuffix: true })}
            </p>
          )}
        </div>
      )}
      
      {device.status === 'overdue' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 rounded-xl border-2 border-destructive/30 pointer-events-none"
        >
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full animate-pulse" />
        </motion.div>
      )}
    </motion.div>
  );
}

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'secondary' | 'warning' | 'destructive';
  delay?: number;
}

const variantStyles = {
  default: 'bg-card',
  primary: 'bg-gradient-to-br from-primary to-primary/80 text-primary-foreground',
  secondary: 'bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground',
  warning: 'bg-gradient-to-br from-warning to-warning/80 text-warning-foreground',
  destructive: 'bg-gradient-to-br from-destructive to-destructive/80 text-destructive-foreground',
};

const iconBgStyles = {
  default: 'bg-primary/10 text-primary',
  primary: 'bg-white/20 text-white',
  secondary: 'bg-white/20 text-white',
  warning: 'bg-white/20 text-white',
  destructive: 'bg-white/20 text-white',
};

export default function StatCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  trend, 
  variant = 'default',
  delay = 0 
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        'relative p-6 rounded-xl border border-border/50 shadow-md overflow-hidden',
        variantStyles[variant]
      )}
    >
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/5 blur-2xl" />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className={cn(
            'text-sm font-medium mb-1',
            variant === 'default' ? 'text-muted-foreground' : 'text-white/80'
          )}>
            {title}
          </p>
          <h3 className="text-3xl font-heading font-bold mb-1">{value}</h3>
          {subtitle && (
            <p className={cn(
              'text-sm',
              variant === 'default' ? 'text-muted-foreground' : 'text-white/70'
            )}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2 text-sm font-medium',
              trend.isPositive 
                ? variant === 'default' ? 'text-success' : 'text-white'
                : variant === 'default' ? 'text-destructive' : 'text-white'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
              <span className={variant === 'default' ? 'text-muted-foreground' : 'text-white/60'}>
                vs last week
              </span>
            </div>
          )}
        </div>
        
        <div className={cn(
          'w-12 h-12 rounded-lg flex items-center justify-center',
          iconBgStyles[variant]
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </motion.div>
  );
}

import React from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUp, ArrowDown, Clock, RefreshCw, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useRef } from 'react';
import { historyAPI } from '@/services/api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function DeviceHistory() {
  const { deviceHistory, devices } = useData();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const sortedHistory = [...deviceHistory].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const getDeviceId = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    return device?.deviceId || deviceId;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      window.dispatchEvent(new Event('focus'));
      await new Promise(resolve => setTimeout(resolve, 1000));
    } finally {
      setIsRefreshing(false);
    }
  };

  const scrollToTop = () => {
    const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollElement) {
      scrollElement.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollElement) {
      scrollElement.scrollTo({ top: scrollElement.scrollHeight, behavior: 'smooth' });
    }
  };

  const handleCleanupDuplicates = async () => {
    if (!confirm('This will remove duplicate entries from the history. Are you sure you want to continue?')) {
      return;
    }

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
        title="Device History" 
        subtitle="Complete log of all device pickups and returns"
      />
      
      {/* Refresh Button and Scroll Controls */}
      <div className="px-4 sm:px-6 pt-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center gap-2"
        >
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            
            <Button
              onClick={handleCleanupDuplicates}
              disabled={isCleaningUp}
              variant="outline"
              size="sm"
              className="gap-2 text-orange-600 hover:text-orange-700 border-orange-300 hover:border-orange-400"
            >
              <Trash2 className={`w-4 h-4 ${isCleaningUp ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">Clean Duplicates</span>
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={scrollToTop}
              variant="outline"
              size="sm"
              className="gap-1"
              title="Scroll to top"
            >
              <ChevronUp className="w-4 h-4" />
              <span className="hidden sm:inline">Top</span>
            </Button>
            <Button
              onClick={scrollToBottom}
              variant="outline"
              size="sm"
              className="gap-1"
              title="Scroll to bottom"
            >
              <ChevronDown className="w-4 h-4" />
              <span className="hidden sm:inline">Bottom</span>
            </Button>
          </div>
        </motion.div>
      </div>
      
      <div className="p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border/50 overflow-hidden"
        >
          <ScrollArea className="h-[600px]" ref={scrollAreaRef}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead className="hidden sm:table-cell">Teacher</TableHead>
                  <TableHead>Date & Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12 text-muted-foreground">
                      <Clock className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      No activity recorded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedHistory.map((entry, index) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-border/50"
                    >
                      <TableCell>
                        <div className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium ${
                          entry.action === 'pickup'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-success/10 text-success'
                        }`}>
                          {entry.action === 'pickup' ? (
                            <ArrowUp className="w-3 h-3 sm:w-4 sm:h-4" />
                          ) : (
                            <ArrowDown className="w-3 h-3 sm:w-4 sm:h-4" />
                          )}
                          <span className="hidden sm:inline">
                            {entry.action === 'pickup' ? 'Picked Up' : 'Returned'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-sm sm:text-base">
                        {getDeviceId(entry.deviceId)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm">
                        {entry.userName}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs sm:text-sm">
                        <div className="sm:hidden">
                          <div className="font-medium">{entry.userName}</div>
                          <div>{format(new Date(entry.timestamp), 'MMM d • h:mm a')}</div>
                        </div>
                        <div className="hidden sm:block">
                          {format(new Date(entry.timestamp), 'MMM d, yyyy • h:mm a')}
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </motion.div>
      </div>
    </div>
  );
}

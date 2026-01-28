import React from 'react';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import Header from '@/components/layout/Header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUp, ArrowDown, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function DeviceHistory() {
  const { deviceHistory, devices } = useData();

  const sortedHistory = [...deviceHistory].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const getDeviceId = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    return device?.deviceId || deviceId;
  };

  return (
    <div className="min-h-screen">
      <Header 
        title="Device History" 
        subtitle="Complete log of all device pickups and returns"
      />
      
      <div className="p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border/50 overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Teacher</TableHead>
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
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-border/50"
                  >
                    <TableCell>
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                        entry.action === 'pickup'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-success/10 text-success'
                      }`}>
                        {entry.action === 'pickup' ? (
                          <ArrowUp className="w-4 h-4" />
                        ) : (
                          <ArrowDown className="w-4 h-4" />
                        )}
                        {entry.action === 'pickup' ? 'Picked Up' : 'Returned'}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {getDeviceId(entry.deviceId)}
                    </TableCell>
                    <TableCell>{entry.userName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(entry.timestamp), 'MMM d, yyyy • h:mm a')}
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </TableBody>
          </Table>
        </motion.div>
      </div>
    </div>
  );
}

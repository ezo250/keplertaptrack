import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Tablet, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog';

interface DeviceRestrictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDeviceId?: string;
}

export default function DeviceRestrictionModal({ 
  isOpen, 
  onClose, 
  currentDeviceId 
}: DeviceRestrictionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center border-0 bg-gradient-to-br from-amber-500 to-orange-500" aria-describedby="device-restriction-desc">
        <DialogDescription id="device-restriction-desc" className="sr-only">
          You already have a device. Please return it before picking up another one
        </DialogDescription>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="flex flex-col items-center py-6"
        >
          {/* Animated Warning Icon */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative mb-6"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, -3, 3, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: 'reverse'
              }}
              className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center"
            >
              <AlertTriangle className="w-12 h-12 text-white" />
            </motion.div>
            
            {/* Pulse Ring */}
            <motion.div
              animate={{ scale: [0.8, 1.5], opacity: [0.8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 rounded-2xl border-4 border-white/40"
            />
          </motion.div>

          {/* Device Icon with bounce */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="mb-4"
          >
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg">
              <Tablet className="w-10 h-10 text-orange-500" />
            </div>
          </motion.div>

          {/* Text Content */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <h2 className="text-2xl font-heading font-bold text-white">
              Hold On! 
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.6, delay: 0.8, repeat: Infinity, repeatDelay: 2 }}
                className="inline-block ml-2"
              >
                ✋
              </motion.span>
            </h2>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-white/10 rounded-xl p-4 mt-4 space-y-3"
            >
              <p className="text-white text-base leading-relaxed font-medium">
                You already have a device with you!
              </p>
              
              {currentDeviceId && (
                <div className="flex items-center justify-center gap-2 bg-white/10 rounded-lg py-2 px-3">
                  <Tablet className="w-4 h-4 text-white" />
                  <span className="text-white font-semibold text-sm">{currentDeviceId}</span>
                </div>
              )}
              
              <div className="pt-2 border-t border-white/20">
                <p className="text-white/90 text-sm leading-relaxed">
                  Please return your current device before picking up another one.
                </p>
              </div>
              
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex items-center justify-center gap-2 pt-2"
              >
                <ArrowDown className="w-5 h-5 text-white" />
                <span className="text-white text-xs font-medium">Return first</span>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Action Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 w-full"
          >
            <Button 
              onClick={onClose}
              className="w-full bg-white text-orange-600 hover:bg-white/90 font-medium shadow-lg"
            >
              Got it!
            </Button>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

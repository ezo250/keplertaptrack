import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Tablet, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog';

interface PickupSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
}

export default function PickupSuccessModal({ isOpen, onClose, deviceId }: PickupSuccessModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center border-0 bg-gradient-to-br from-primary to-primary/90" aria-describedby="pickup-success-desc">
        <DialogDescription id="pickup-success-desc" className="sr-only">
          Device {deviceId} has been successfully picked up
        </DialogDescription>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="flex flex-col items-center py-6"
        >
          {/* Animated Device Icon */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative mb-6"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: 'reverse'
              }}
              className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center"
            >
              <Tablet className="w-12 h-12 text-white" />
            </motion.div>
            
            {/* Pulse Ring */}
            <motion.div
              animate={{ scale: [0.8, 1.5], opacity: [0.8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 rounded-2xl border-4 border-white/40"
            />
          </motion.div>

          {/* Success Icon with bounce */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="mb-4"
          >
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg">
              <CheckCircle className="w-10 h-10 text-success" />
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
              Device Picked Up! 
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="inline-block ml-2"
              >
                😊
              </motion.span>
            </h2>
            
            <p className="text-lg text-white/90 font-medium">
              {deviceId}
            </p>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-white/10 rounded-xl p-4 mt-4"
            >
              <p className="text-white/90 text-sm leading-relaxed">
                Thank you for picking me up! 
                <br />
                <span className="font-medium">Please remember to return me after your class.</span>
              </p>
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
              className="w-full bg-white text-primary hover:bg-white/90 font-medium"
            >
              Got it, thanks!
            </Button>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Tablet, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
} from '@/components/ui/dialog';

interface ReturnSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
}

export default function ReturnSuccessModal({ isOpen, onClose, deviceId }: ReturnSuccessModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center border-0 bg-gradient-to-br from-secondary to-secondary/90" aria-describedby="return-success-desc">
        <DialogDescription id="return-success-desc" className="sr-only">
          Device {deviceId} has been successfully returned
        </DialogDescription>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="flex flex-col items-center py-6"
        >
          {/* Animated Sparkles */}
          <motion.div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 0, 
                  x: Math.random() * 200 - 100,
                  y: Math.random() * 200 - 100,
                  scale: 0
                }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  y: [0, -50]
                }}
                transition={{ 
                  delay: 0.3 + i * 0.1,
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
                className="absolute"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + (i % 3) * 20}%`
                }}
              >
                <Sparkles className="w-6 h-6 text-white/60" />
              </motion.div>
            ))}
          </motion.div>

          {/* Success Animation */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative mb-6"
          >
            <motion.div
              animate={{ 
                y: [0, -8, 0],
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
              className="w-24 h-24 rounded-2xl bg-white/20 flex items-center justify-center"
            >
              <Tablet className="w-12 h-12 text-white" />
            </motion.div>
            
            {/* Checkmark badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg"
            >
              <CheckCircle className="w-6 h-6 text-success" />
            </motion.div>
          </motion.div>

          {/* Text Content */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <h2 className="text-2xl font-heading font-bold text-white flex items-center justify-center gap-2">
              Device Returned!
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, delay: 0.8, repeat: Infinity, repeatDelay: 2 }}
              >
                ✅
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
              <p className="text-white/90 text-sm leading-relaxed flex items-center justify-center gap-2">
                <Heart className="w-5 h-5 text-white" />
                Thank you for being responsible!
              </p>
              <p className="text-white/70 text-xs mt-2">
                The device is now available for other teachers
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
              className="w-full bg-white text-secondary hover:bg-white/90 font-medium"
            >
              You're welcome!
            </Button>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

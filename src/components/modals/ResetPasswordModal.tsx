import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Key, Copy, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<string | null>;
  teacherName: string;
  teacherEmail: string;
}

export default function ResetPasswordModal({
  isOpen,
  onClose,
  onConfirm,
  teacherName,
  teacherEmail,
}: ResetPasswordModalProps) {
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    try {
      const password = await onConfirm();
      if (password) {
        setNewPassword(password);
      }
    } catch (error) {
      toast.error('Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleClose = () => {
    setNewPassword(null);
    setShowPassword(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary" />
            Reset Teacher Password
          </DialogTitle>
        </DialogHeader>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 pt-4"
        >
          {!newPassword ? (
            <>
              {/* Warning Icon */}
              <div className="flex justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-warning/10 flex items-center justify-center"
                >
                  <AlertTriangle className="w-10 h-10 text-warning" />
                </motion.div>
              </div>

              {/* Teacher Info */}
              <div className="text-center space-y-1">
                <p className="font-semibold text-foreground text-lg">{teacherName}</p>
                <p className="text-sm text-muted-foreground">{teacherEmail}</p>
              </div>

              {/* Warning Message */}
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 text-sm">
                <p className="font-medium text-foreground mb-1">⚠️ Warning</p>
                <p className="text-muted-foreground">
                  This will generate a new password for this teacher. The old password will no longer work.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReset}
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Success Icon */}
              <div className="flex justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center"
                >
                  <Key className="w-10 h-10 text-success" />
                </motion.div>
              </div>

              {/* Teacher Info */}
              <div className="text-center space-y-1">
                <p className="font-semibold text-foreground text-lg">{teacherName}</p>
                <p className="text-sm text-muted-foreground">{teacherEmail}</p>
              </div>

              {/* New Password Section */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium text-foreground">New Password:</p>
                
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-background rounded-md px-3 py-2 font-mono text-sm">
                    {showPassword ? newPassword : '•'.repeat(newPassword.length)}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="flex-shrink-0"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(newPassword, 'Password')}
                    className="flex-shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  ⚠️ Save this password securely and share it with the teacher.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Quick Copy:</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(teacherEmail, 'Email')}
                    className="flex-1 gap-2"
                  >
                    <Copy className="w-3 h-3" />
                    Email
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(newPassword, 'Password')}
                    className="flex-1 gap-2"
                  >
                    <Copy className="w-3 h-3" />
                    Password
                  </Button>
                </div>
              </div>

              {/* Close Button */}
              <Button onClick={handleClose} className="w-full">
                Done
              </Button>
            </>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

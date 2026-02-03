import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Copy, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface PasswordGeneratedModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherName: string;
  email: string;
  password: string;
}

export default function PasswordGeneratedModal({
  isOpen,
  onClose,
  teacherName,
  email,
  password,
}: PasswordGeneratedModalProps) {
  const [showPassword, setShowPassword] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-success">
            <CheckCircle className="w-5 h-5" />
            Teacher Added Successfully
          </DialogTitle>
          <DialogDescription>
            Save the auto-generated password for {teacherName}
          </DialogDescription>
        </DialogHeader>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 pt-4"
        >
          {/* Success Icon */}
          <div className="flex justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center"
            >
              <CheckCircle className="w-10 h-10 text-success" />
            </motion.div>
          </div>

          {/* Teacher Info */}
          <div className="text-center space-y-1">
            <p className="font-semibold text-foreground text-lg">{teacherName}</p>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>

          {/* Password Section */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Auto-Generated Password:</p>
            
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-background rounded-md px-3 py-2 font-mono text-sm">
                {showPassword ? password : '•'.repeat(password.length)}
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
                onClick={() => copyToClipboard(password, 'Password')}
                className="flex-shrink-0"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              ⚠️ Save this password securely. It won't be shown again.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Quick Copy:</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(email, 'Email')}
                className="flex-1 gap-2"
              >
                <Copy className="w-3 h-3" />
                Email
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(password, 'Password')}
                className="flex-1 gap-2"
              >
                <Copy className="w-3 h-3" />
                Password
              </Button>
            </div>
          </div>

          {/* Close Button */}
          <Button onClick={onClose} className="w-full">
            Done
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

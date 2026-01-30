import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, X, CheckCircle } from 'lucide-react';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title: string;
}

export default function QRScanner({ isOpen, onClose, onScan, title }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [scanned, setScanned] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setError('');
      setScanned(false);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsScanning(true);
          startScanning();
        };
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Failed to access camera. Please allow camera permission and try again.');
    }
  };

  const startScanning = () => {
    // For demo purposes, we'll simulate QR detection
    // In a real app, you'd use a proper QR detection library here
    intervalRef.current = setInterval(() => {
      if (scanned) return;
      
      // Simulate QR code detection after 3 seconds
      setTimeout(() => {
        if (!scanned && isScanning) {
          // Simulate scanning a pickup QR code
          const mockQRData = 'PICKUP_AUTH_' + Date.now();
          handleQRDetected(mockQRData);
        }
      }, 3000);
    }, 100);
  };

  const handleQRDetected = (qrData: string) => {
    if (scanned) return;
    
    setScanned(true);
    console.log('QR Detected:', qrData);
    
    setTimeout(() => {
      onScan(qrData);
      stopCamera();
      onClose();
    }, 1000);
  };

  const stopCamera = () => {
    try {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      setIsScanning(false);
      setScanned(false);
    } catch (err) {
      console.error('Error stopping camera:', err);
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // Manual QR input for testing
  const handleManualInput = () => {
    const qrData = prompt('Enter QR code data for testing:');
    if (qrData) {
      handleQRDetected(qrData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" aria-describedby="qr-scanner-desc">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p id="qr-scanner-desc" className="text-sm text-muted-foreground">
            Position the QR code in front of your camera. Scanning will happen automatically.
          </p>
          
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-64 object-cover"
              autoPlay
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {scanned && (
              <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
                <div className="text-white text-center bg-green-500 rounded-full p-4">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                  <p className="font-semibold">Authorized!</p>
                </div>
              </div>
            )}
            
            {!isScanning && !scanned && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-white text-center">
                  <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Starting camera...</p>
                </div>
              </div>
            )}
            
            {isScanning && !scanned && (
              <div className="absolute inset-0">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-48 h-48 border-2 border-white rounded-lg">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400"></div>
                  </div>
                </div>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-center">
                  <p className="text-sm font-medium">Looking for QR code...</p>
                  <p className="text-xs opacity-75">Hold QR code steady in the frame</p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} className="flex-1 gap-2">
              <X className="w-4 h-4" />
              Close
            </Button>
            <Button variant="secondary" onClick={handleManualInput} className="flex-1 gap-2">
              Manual Input
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
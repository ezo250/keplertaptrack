import React, { useRef, useEffect, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Camera, X, AlertCircle, ScanLine } from 'lucide-react';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title: string;
}

export default function QRScanner({ isOpen, onClose, onScan, title }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string>('');
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef<boolean>(false);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      initializeCamera();
    }

    return () => {
      cleanupScanner();
    };
  }, [isOpen]);

  const initializeCamera = async () => {
    if (!readerRef.current) {
      readerRef.current = new BrowserMultiFormatReader();
    }

    // Check camera permission
    try {
      const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setCameraPermission(permissionStatus.state);
      
      permissionStatus.addEventListener('change', () => {
        setCameraPermission(permissionStatus.state);
      });
    } catch (err) {
      console.log('Permission API not supported');
    }

    await startCamera();
  };

  const startCamera = async () => {
    if (!videoRef.current) return;

    try {
      setError('');
      setIsCameraReady(false);

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Request camera access with mobile-friendly constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' }, // Prefer rear camera on mobile
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
        },
        audio: false,
      };

      streamRef.current = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        
        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              resolve();
            };
          }
        });

        // Check if video is already playing before calling play()
        if (videoRef.current.paused) {
          await videoRef.current.play();
        }
        
        setCameraPermission('granted');
        setIsCameraReady(true);
        
        // Wait a bit for video to stabilize
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraPermission('denied');
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera access denied. Please grant camera permission in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found on this device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is already in use by another application.');
      } else {
        setError('Failed to access camera. Please try again.');
      }
    }
  };

  const startScanning = () => {
    if (!videoRef.current || scanningRef.current || !isCameraReady) return;
    
    setIsScanning(true);
    scanningRef.current = true;
    scanContinuously();
  };

  const scanContinuously = () => {
    if (!readerRef.current || !videoRef.current || !scanningRef.current) return;

    const performScan = async () => {
      if (!videoRef.current || !readerRef.current || !scanningRef.current) return;

      try {
        // Check if video is ready
        if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
          const result = await readerRef.current.decodeFromVideoElement(videoRef.current);
          
          if (result && result.getText()) {
            // Success - QR code detected
            const qrCode = result.getText();
            console.log('QR Code detected:', qrCode);
            
            // Stop scanning immediately for instant feedback
            stopScanning();
            
            // Call onScan callback - parent will handle closing
            onScan(qrCode);
            return;
          }
        }
      } catch (err) {
        // NotFoundException is expected when no QR code is in view
        if (!(err instanceof NotFoundException)) {
          console.error('Scanning error:', err);
        }
      }
    };

    // Use setInterval for more reliable continuous scanning
    scanIntervalRef.current = setInterval(performScan, 300); // Scan every 300ms
  };

  const stopScanning = () => {
    scanningRef.current = false;
    setIsScanning(false);

    // Clear scan interval
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }

    // Clear video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Reset reader
    if (readerRef.current) {
      try {
        readerRef.current.reset();
      } catch (err) {
        console.error('Error resetting reader:', err);
      }
    }
  };

  const cleanupScanner = () => {
    stopScanning();
  };

  const handleClose = () => {
    cleanupScanner();
    onClose();
  };

  const handleRetry = () => {
    setError('');
    setCameraPermission('prompt');
    setIsCameraReady(false);
    startCamera();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md w-full p-4 sm:p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-xs text-muted-foreground">
            Position the QR code in the camera view and press the scan button
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 sm:space-y-4">
          {/* Video Container - Fullscreen on mobile */}
          <div className="relative bg-black rounded-lg overflow-hidden w-full" style={{ aspectRatio: '4/3' }}>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            
            {/* Scanning overlay - Larger on mobile */}
            {isScanning && !error && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative">
                  {/* Scanning frame - responsive size */}
                  <div className="w-56 h-56 sm:w-64 sm:h-64 border-4 border-primary rounded-lg animate-pulse" />
                  {/* Corner guides - larger and more visible */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-[5px] border-l-[5px] border-white rounded-tl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-[5px] border-r-[5px] border-white rounded-tr" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[5px] border-l-[5px] border-white rounded-bl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[5px] border-r-[5px] border-white rounded-br" />
                </div>
              </div>
            )}

            {/* Camera Ready overlay - show viewfinder without scanning */}
            {isCameraReady && !isScanning && !error && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative">
                  {/* Viewfinder frame */}
                  <div className="w-56 h-56 sm:w-64 sm:h-64 border-2 border-white/50 rounded-lg" />
                  {/* Corner guides */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-[4px] border-l-[4px] border-white rounded-tl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-[4px] border-r-[4px] border-white rounded-tr" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-[4px] border-l-[4px] border-white rounded-bl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-[4px] border-r-[4px] border-white rounded-br" />
                </div>
              </div>
            )}

            {/* Loading state */}
            {!isCameraReady && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-white text-center px-4">
                  <Camera className="w-16 h-16 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-2 opacity-50 animate-pulse" />
                  <p className="text-base sm:text-sm font-medium">Initializing camera...</p>
                </div>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-white text-center px-6 sm:px-4">
                  <AlertCircle className="w-16 h-16 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-2 text-destructive" />
                  <p className="text-base sm:text-sm">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Instructions - More prominent on mobile */}
          {isCameraReady && !isScanning && !error && (
            <div className="p-4 sm:p-3 bg-primary/10 border-2 sm:border border-primary/20 rounded-lg">
              <p className="text-base sm:text-sm text-center text-primary font-semibold sm:font-medium">
                📱 Position QR code within the frame
              </p>
              <p className="text-sm sm:text-xs text-center text-primary/80 mt-1">
                Press "Scan QR Code" button when ready
              </p>
            </div>
          )}

          {isScanning && !error && (
            <div className="p-4 sm:p-3 bg-primary/10 border-2 sm:border border-primary/20 rounded-lg">
              <p className="text-base sm:text-sm text-center text-primary font-semibold sm:font-medium">
                🔍 Scanning in progress...
              </p>
              <p className="text-sm sm:text-xs text-center text-primary/80 mt-1">
                Hold steady
              </p>
            </div>
          )}

          {/* Camera permission info */}
          {cameraPermission === 'denied' && (
            <div className="p-4 sm:p-3 bg-destructive/10 border-2 sm:border border-destructive/20 rounded-lg">
              <p className="text-base sm:text-sm text-destructive font-medium">
                Camera access is blocked. Please enable it in your browser settings and try again.
              </p>
            </div>
          )}

          {/* Action buttons - Larger touch targets on mobile */}
          <div className="flex flex-col gap-3 sm:gap-2 pt-2">
            {/* Scan button - only show when camera is ready and not scanning */}
            {isCameraReady && !isScanning && !error && (
              <Button 
                onClick={startScanning} 
                className="w-full h-14 sm:h-12 text-base sm:text-sm font-bold"
                size="lg"
              >
                <ScanLine className="w-6 h-6 sm:w-5 sm:h-5 mr-2" />
                Scan QR Code
              </Button>
            )}

            <div className="flex gap-3 sm:gap-2">
              <Button 
                variant="outline" 
                onClick={handleClose} 
                className="flex-1 h-12 sm:h-10 text-base sm:text-sm font-semibold"
              >
                <X className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
                Cancel
              </Button>
              {error && (
                <Button 
                  onClick={handleRetry} 
                  className="flex-1 h-12 sm:h-10 text-base sm:text-sm font-semibold"
                >
                  <Camera className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
                  Retry
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import React, { useRef, useEffect, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera, X, AlertCircle } from 'lucide-react';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title: string;
}

export default function QRScanner({ isOpen, onClose, onScan, title }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>('');
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      initializeScanner();
    }

    return () => {
      cleanupScanner();
    };
  }, [isOpen]);

  const initializeScanner = async () => {
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

    startScanning();
  };

  const startScanning = async () => {
    if (!videoRef.current || isScanning) return;

    try {
      setIsScanning(true);
      setError('');

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Request camera access with mobile-friendly constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' }, // Prefer rear camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      streamRef.current = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        await videoRef.current.play();
        setCameraPermission('granted');
        
        // Start continuous scanning
        scanContinuously();
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
      setIsScanning(false);
    }
  };

  const scanContinuously = async () => {
    if (!readerRef.current || !videoRef.current || !streamRef.current) return;

    const scan = async () => {
      if (!videoRef.current || !readerRef.current || !isScanning) return;

      try {
        const result = await readerRef.current.decodeFromVideoElement(videoRef.current);
        
        if (result && result.getText()) {
          // Success - QR code detected
          onScan(result.getText());
          stopScanning();
          onClose();
          return;
        }
      } catch (err) {
        // NotFoundException is expected when no QR code is in view
        if (!(err instanceof NotFoundException)) {
          console.error('Scanning error:', err);
        }
      }

      // Continue scanning
      animationFrameRef.current = requestAnimationFrame(scan);
    };

    scan();
  };

  const stopScanning = () => {
    setIsScanning(false);

    // Cancel animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
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
    startScanning();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            
            {/* Scanning overlay */}
            {isScanning && !error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-4 border-primary rounded-lg animate-pulse" />
              </div>
            )}

            {/* Loading state */}
            {!isScanning && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-white text-center">
                  <Camera className="w-12 h-12 mx-auto mb-2 opacity-50 animate-pulse" />
                  <p className="text-sm">Initializing camera...</p>
                </div>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-white text-center px-4">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 text-destructive" />
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          {isScanning && !error && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-center text-primary font-medium">
                Position the QR code within the frame
              </p>
            </div>
          )}

          {/* Camera permission info */}
          {cameraPermission === 'denied' && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">
                Camera access is blocked. Please enable it in your browser settings and try again.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-between gap-3">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            {error && (
              <Button onClick={handleRetry} className="flex-1">
                <Camera className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

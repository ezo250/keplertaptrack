import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import Header from '@/components/layout/Header';
import DeviceCard from '@/components/dashboard/DeviceCard';
import PickupSuccessModal from '@/components/modals/PickupSuccessModal';
import ReturnSuccessModal from '@/components/modals/ReturnSuccessModal';
import QRScanner from '@/components/teacher/QRScanner';
import DeviceRestrictionModal from '@/components/modals/DeviceRestrictionModal';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tablet, ArrowUp, ArrowDown, QrCode } from 'lucide-react';
import { Device } from '@/types';

export default function TeacherDevices() {
  const { user } = useAuth();
  const { 
    devices, 
    getAvailableDevices, 
    getDevicesInUse,
    getUserDevices,
    pickupDevice,
    returnDevice
  } = useData();

  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [showPickupSuccess, setShowPickupSuccess] = useState(false);
  const [showReturnSuccess, setShowReturnSuccess] = useState(false);
  const [showRestrictionModal, setShowRestrictionModal] = useState(false);
  const [lastActionDevice, setLastActionDevice] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scannerAction, setScannerAction] = useState<'pickup' | 'return'>('pickup');
  const [isAuthorized, setIsAuthorized] = useState(false);

  const availableDevices = getAvailableDevices();
  const devicesInUse = getDevicesInUse();
  const myDevices = getUserDevices(user?.id || '');

  const handlePickup = (device: Device) => {
    if (!user) return;
    
    // Check if authorized first
    if (!isAuthorized) {
      setSelectedDevice(device);
      setScannerAction('pickup');
      setShowQRScanner(true);
      return;
    }
    
    // Prevent picking up if teacher already has a device
    if (myDevices.length > 0) {
      setSelectedDevice(null);
      setShowRestrictionModal(true);
      return;
    }
    
    pickupDevice(device.id, user.id, user.name);
    setLastActionDevice(device.deviceId);
    setSelectedDevice(null);
    setIsAuthorized(false); // Reset authorization
    setShowPickupSuccess(true);
  };

  const handleReturn = (device: Device) => {
    if (!user) return;
    
    // Check if authorized first
    if (!isAuthorized) {
      setSelectedDevice(device);
      setScannerAction('return');
      setShowQRScanner(true);
      return;
    }
    
    returnDevice(device.id, user.id, user.name);
    setLastActionDevice(device.deviceId);
    setSelectedDevice(null);
    setIsAuthorized(false); // Reset authorization
    setShowReturnSuccess(true);
  };

  const handleQRScan = (result: string) => {
    // Validate QR code based on action type
    const expectedPrefix = scannerAction === 'pickup' ? 'PICKUP_AUTH_' : 'RETURN_AUTH_';
    
    if (result.startsWith(expectedPrefix)) {
      setIsAuthorized(true);
      setShowQRScanner(false);
      
      // Proceed with the action
      if (selectedDevice) {
        if (scannerAction === 'pickup') {
          handlePickup(selectedDevice);
        } else {
          handleReturn(selectedDevice);
        }
      }
    } else {
      alert(`Invalid QR code. Please scan the correct ${scannerAction} authorization code.`);
    }
  };

  return (
    <div className="min-h-screen">
      <Header 
        title="Device Station"
        subtitle="View all devices and their current status"
      />
      
      <div className="p-6 space-y-8">
        {/* My Devices Section */}
        {myDevices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl border border-primary/20 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-heading font-semibold text-foreground">My Devices</h2>
                <p className="text-sm text-muted-foreground">Devices currently with you</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {myDevices.map((device, index) => (
                <motion.div
                  key={device.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative"
                >
                  <DeviceCard device={device} />
                  <Button
                    onClick={() => handleReturn(device)}
                    className="absolute bottom-4 left-4 right-4 gap-2"
                    variant="default"
                    size="sm"
                  >
                    <QrCode className="w-4 h-4" />
                    Scan to Return
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Available Devices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border/50 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-heading font-semibold text-foreground">Available Devices</h2>
              <p className="text-sm text-muted-foreground">
                {availableDevices.length} devices at pickup station
                {myDevices.length > 0 && (
                  <span className="ml-2 text-warning">• Return your current device to pick up another</span>
                )}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableDevices.map((device, index) => (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.03 }}
                onClick={() => {
                  if (myDevices.length > 0) {
                    setShowRestrictionModal(true);
                    return;
                  }
                  setSelectedDevice(device);
                }}
                className={myDevices.length > 0 ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
              >
                <DeviceCard device={device} onClick={() => {
                  if (myDevices.length === 0) {
                    setSelectedDevice(device);
                  }
                }} />
              </motion.div>
            ))}
          </div>
          
          {availableDevices.length === 0 && (
            <div className="text-center py-12">
              <Tablet className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No devices available</p>
            </div>
          )}
        </motion.div>

        {/* Devices In Use */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border/50 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-heading font-semibold text-foreground">Devices In Use</h2>
              <p className="text-sm text-muted-foreground">{devicesInUse.length} devices currently with other teachers</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {devicesInUse.filter(d => d.currentUserId !== user?.id).map((device, index) => (
              <DeviceCard 
                key={device.id} 
                device={device}
                delay={0.3 + index * 0.03}
              />
            ))}
          </div>
          
          {devicesInUse.filter(d => d.currentUserId !== user?.id).length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No devices with other teachers</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Pickup Confirmation Dialog */}
      <Dialog open={!!selectedDevice && selectedDevice.status === 'available'} onOpenChange={() => setSelectedDevice(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUp className="w-5 h-5 text-primary" />
              Confirm Pickup
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Tablet className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-lg font-semibold">{selectedDevice?.deviceId}</p>
                <p className="text-sm text-muted-foreground">Ready for pickup</p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Are you sure you want to pick up this device? Remember to return it after your class.
            </p>
            
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedDevice(null)}>
                Cancel
              </Button>
              <Button onClick={() => selectedDevice && handlePickup(selectedDevice)}>
                <QrCode className="w-4 h-4 mr-2" />
                Scan to Pick Up
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Modals */}
      <PickupSuccessModal 
        isOpen={showPickupSuccess}
        onClose={() => setShowPickupSuccess(false)}
        deviceId={lastActionDevice}
      />
      
      <ReturnSuccessModal
        isOpen={showReturnSuccess}
        onClose={() => setShowReturnSuccess(false)}
        deviceId={lastActionDevice}
      />
      
      {/* QR Scanner */}
      <QRScanner
        isOpen={showQRScanner}
        onClose={() => {
          setShowQRScanner(false);
          setSelectedDevice(null);
          setIsAuthorized(false);
        }}
        onScan={handleQRScan}
        title={`Scan ${scannerAction === 'pickup' ? 'Pickup' : 'Return'} Authorization`}
      />
      
      {/* Restriction Modal */}
      <DeviceRestrictionModal
        isOpen={showRestrictionModal}
        onClose={() => setShowRestrictionModal(false)}
        currentDeviceId={myDevices[0]?.deviceId}
      />
    </div>
  );
}

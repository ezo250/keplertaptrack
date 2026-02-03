import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import Header from '@/components/layout/Header';
import DeviceCard from '@/components/dashboard/DeviceCard';
import DeleteConfirmModal from '@/components/modals/DeleteConfirmModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Tablet, Filter, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DeviceStatus, Device } from '@/types';
import { devicesAPI } from '@/services/api';

export default function DevicesManagement() {
  const { devices, addDevice, removeDevice, getAvailableDevices, getDevicesInUse, getOverdueDevices } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | 'all'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [deleteDevice, setDeleteDevice] = useState<{ id: string; deviceId: string } | null>(null);
  const [newDeviceId, setNewDeviceId] = useState('');
  const [editDeviceId, setEditDeviceId] = useState('');

  const filteredDevices = devices.filter(d => {
    const matchesSearch = d.deviceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.currentUserName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAddDevice = async () => {
    if (!newDeviceId.trim()) {
      toast.error('Please enter a device ID');
      return;
    }

    if (devices.some(d => d.deviceId === newDeviceId)) {
      toast.error('A device with this ID already exists');
      return;
    }

    try {
      await addDevice(newDeviceId);
      toast.success(`Device ${newDeviceId} added successfully`);
      setNewDeviceId('');
      setIsAddDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add device');
    }
  };

  const handleEditDevice = async () => {
    if (!editingDevice || !editDeviceId.trim()) {
      toast.error('Please enter a device ID');
      return;
    }

    if (devices.some(d => d.deviceId === editDeviceId && d.id !== editingDevice.id)) {
      toast.error('A device with this ID already exists');
      return;
    }

    try {
      await devicesAPI.update(editingDevice.id, editDeviceId);
      toast.success('Device updated successfully');
      setEditingDevice(null);
      setEditDeviceId('');
      setIsEditDialogOpen(false);
      // Refresh data
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update device');
    }
  };

  const handleDeleteDevice = async () => {
    if (!deleteDevice) return;

    try {
      await removeDevice(deleteDevice.id);
      toast.success('Device removed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove device');
    }
  };

  const openEditDialog = (device: Device) => {
    setEditingDevice(device);
    setEditDeviceId(device.deviceId);
    setIsEditDialogOpen(true);
  };

  const statusCounts = {
    all: devices.length,
    available: getAvailableDevices().length,
    in_use: getDevicesInUse().length,
    overdue: getOverdueDevices().length,
  };

  return (
    <div className="min-h-screen">
      <Header 
        title="Devices Management" 
        subtitle="Track and manage all attendance devices"
      />
      
      <div className="p-6 space-y-6">
        {/* Status Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-2"
        >
          {[
            { value: 'all', label: 'All Devices' },
            { value: 'available', label: 'Available' },
            { value: 'in_use', label: 'In Use' },
            { value: 'overdue', label: 'Overdue' },
          ].map((tab) => (
            <Button
              key={tab.value}
              variant={statusFilter === tab.value ? 'default' : 'outline'}
              onClick={() => setStatusFilter(tab.value as DeviceStatus | 'all')}
              className="gap-2"
            >
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                statusFilter === tab.value 
                  ? 'bg-white/20' 
                  : 'bg-muted'
              }`}>
                {statusCounts[tab.value as keyof typeof statusCounts]}
              </span>
            </Button>
          ))}
        </motion.div>

        {/* Actions Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 justify-between"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by device ID or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Device
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Device</DialogTitle>
                <DialogDescription>
                  Register a new device to the system
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="deviceId">Device ID *</Label>
                  <Input
                    id="deviceId"
                    placeholder="e.g., TAP-011"
                    value={newDeviceId}
                    onChange={(e) => setNewDeviceId(e.target.value.toUpperCase())}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use a unique identifier for the device
                  </p>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddDevice}>
                    <Tablet className="w-4 h-4 mr-2" />
                    Add Device
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Devices Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
          <AnimatePresence>
            {filteredDevices.map((device, index) => (
              <div key={device.id} className="relative group">
                <DeviceCard 
                  device={device} 
                  delay={0.1 + index * 0.03}
                />
                {/* Action Buttons Overlay */}
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                    onClick={() => openEditDialog(device)}
                    title="Edit Device"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8 bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg"
                    onClick={() => setDeleteDevice({ id: device.id, deviceId: device.deviceId })}
                    title="Delete Device"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </AnimatePresence>
        </motion.div>
        
        {filteredDevices.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Tablet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No devices found</p>
          </motion.div>
        )}
      </div>

      {/* Edit Device Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
            <DialogDescription>
              Update device identifier
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-deviceId">Device ID *</Label>
              <Input
                id="edit-deviceId"
                placeholder="e.g., TAP-011"
                value={editDeviceId}
                onChange={(e) => setEditDeviceId(e.target.value.toUpperCase())}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditDevice}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteDevice}
        onClose={() => setDeleteDevice(null)}
        onConfirm={handleDeleteDevice}
        title="Delete Device"
        description="Are you sure you want to delete this device?"
        itemName={deleteDevice?.deviceId}
      />
    </div>
  );
}

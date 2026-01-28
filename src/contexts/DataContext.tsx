import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Device, User, TimetableEntry, Notification, DeviceHistory, DeviceStatus } from '@/types';
import { devicesAPI, teachersAPI, timetableAPI, historyAPI, notificationsAPI } from '@/services/api';

interface DataContextType {
  devices: Device[];
  teachers: User[];
  timetable: TimetableEntry[];
  notifications: Notification[];
  deviceHistory: DeviceHistory[];
  isLoading: boolean;
  addDevice: (deviceId: string) => Promise<void>;
  removeDevice: (id: string) => Promise<void>;
  updateDevice: (id: string, deviceId: string) => Promise<void>;
  updateDeviceStatus: (id: string, status: DeviceStatus, userId?: string, userName?: string) => void;
  addTeacher: (teacher: Omit<User, 'id' | 'role'>) => Promise<any>;
  removeTeacher: (id: string) => Promise<void>;
  updateTeacher: (id: string, updates: Partial<User>) => Promise<void>;
  pickupDevice: (deviceId: string, userId: string, userName: string) => Promise<void>;
  returnDevice: (deviceId: string, userId: string, userName: string) => Promise<void>;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  getAvailableDevices: () => Device[];
  getDevicesInUse: () => Device[];
  getOverdueDevices: () => Device[];
  getUserDevices: (userId: string) => Device[];
  addTimetableEntry: (entry: Omit<TimetableEntry, 'id'>) => Promise<void>;
  updateTimetableEntry: (id: string, entry: Omit<TimetableEntry, 'id'>) => Promise<void>;
  removeTimetableEntry: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Fetch devices
  const { data: devices = [], isLoading: devicesLoading } = useQuery({
    queryKey: ['devices'],
    queryFn: devicesAPI.getAll,
  });

  // Fetch teachers
  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: teachersAPI.getAll,
  });

  // Fetch timetable
  const { data: timetable = [], isLoading: timetableLoading } = useQuery({
    queryKey: ['timetable'],
    queryFn: timetableAPI.getAll,
  });

  // Fetch device history
  const { data: deviceHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ['deviceHistory'],
    queryFn: historyAPI.getAll,
  });

  // Mutations
  const addDeviceMutation = useMutation({
    mutationFn: devicesAPI.add,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });

  const removeDeviceMutation = useMutation({
    mutationFn: devicesAPI.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });

  const pickupDeviceMutation = useMutation({
    mutationFn: ({ id, userId, userName }: { id: string; userId: string; userName: string }) =>
      devicesAPI.pickup(id, userId, userName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['deviceHistory'] });
    },
  });

  const returnDeviceMutation = useMutation({
    mutationFn: ({ id, userId, userName }: { id: string; userId: string; userName: string }) =>
      devicesAPI.return(id, userId, userName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      queryClient.invalidateQueries({ queryKey: ['deviceHistory'] });
    },
  });

  const addTeacherMutation = useMutation({
    mutationFn: teachersAPI.add,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });

  const removeTeacherMutation = useMutation({
    mutationFn: teachersAPI.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });

  const updateTeacherMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<User> }) =>
      teachersAPI.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
    },
  });

  const addTimetableEntryMutation = useMutation({
    mutationFn: timetableAPI.add,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
    },
  });

  const updateTimetableEntryMutation = useMutation({
    mutationFn: ({ id, entry }: { id: string; entry: any }) =>
      timetableAPI.update(id, entry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
    },
  });

  const removeTimetableEntryMutation = useMutation({
    mutationFn: timetableAPI.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable'] });
    },
  });

  const isLoading = devicesLoading || teachersLoading || timetableLoading || historyLoading;

  const addDevice = async (deviceId: string) => {
    await addDeviceMutation.mutateAsync(deviceId);
  };

  const removeDevice = async (id: string) => {
    await removeDeviceMutation.mutateAsync(id);
  };

  const updateDevice = async (id: string, deviceId: string) => {
    await devicesAPI.update(id, deviceId);
    queryClient.invalidateQueries({ queryKey: ['devices'] });
  };

  const updateDeviceStatus = (id: string, status: DeviceStatus, userId?: string, userName?: string) => {
    // This is kept for compatibility but not used in the new implementation
    console.log('updateDeviceStatus is deprecated, use pickupDevice or returnDevice instead');
  };

  const addTeacher = async (teacher: Omit<User, 'id' | 'role'>) => {
    const result = await addTeacherMutation.mutateAsync(teacher);
    return result;
  };

  const removeTeacher = async (id: string) => {
    await removeTeacherMutation.mutateAsync(id);
  };

  const updateTeacher = async (id: string, updates: Partial<User>) => {
    await updateTeacherMutation.mutateAsync({ id, updates });
  };

  const pickupDevice = async (deviceId: string, userId: string, userName: string) => {
    await pickupDeviceMutation.mutateAsync({ id: deviceId, userId, userName });
  };

  const returnDevice = async (deviceId: string, userId: string, userName: string) => {
    await returnDeviceMutation.mutateAsync({ id: deviceId, userId, userName });
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    // Notifications can be implemented later
    console.log('Notification:', notification);
  };

  const markNotificationRead = (id: string) => {
    // Notifications can be implemented later
    console.log('Mark notification read:', id);
  };

  const addTimetableEntry = async (entry: Omit<TimetableEntry, 'id'>) => {
    await addTimetableEntryMutation.mutateAsync(entry);
  };

  const updateTimetableEntry = async (id: string, entry: Omit<TimetableEntry, 'id'>) => {
    await updateTimetableEntryMutation.mutateAsync({ id, entry });
  };

  const removeTimetableEntry = async (id: string) => {
    await removeTimetableEntryMutation.mutateAsync(id);
  };

  const getAvailableDevices = () => devices.filter((d: Device) => d.status === 'available');
  const getDevicesInUse = () => devices.filter((d: Device) => d.status === 'in_use');
  const getOverdueDevices = () => devices.filter((d: Device) => d.status === 'overdue');
  const getUserDevices = (userId: string) => devices.filter((d: Device) => d.currentUserId === userId);

  return (
    <DataContext.Provider
      value={{
        devices,
        teachers,
        timetable,
        notifications: [],
        deviceHistory,
        isLoading,
        addDevice,
        removeDevice,
        updateDevice,
        updateDeviceStatus,
        addTeacher,
        removeTeacher,
        updateTeacher,
        pickupDevice,
        returnDevice,
        addNotification,
        markNotificationRead,
        getAvailableDevices,
        getDevicesInUse,
        getOverdueDevices,
        getUserDevices,
        addTimetableEntry,
        updateTimetableEntry,
        removeTimetableEntry,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

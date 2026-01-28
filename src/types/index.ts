export type UserRole = 'super_admin' | 'teacher';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  courses?: string[];
  avatar?: string;
}

export type DeviceStatus = 'available' | 'in_use' | 'overdue';

export interface Device {
  id: string;
  deviceId: string;
  status: DeviceStatus;
  currentUserId?: string;
  currentUserName?: string;
  pickedUpAt?: Date;
  expectedReturnAt?: Date;
  lastReturnedAt?: Date;
  lastUserId?: string;
  lastUserName?: string;
}

export interface TimetableEntry {
  id: string;
  teacherId: string;
  teacherName: string;
  course: string;
  classroom?: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  startTime: string;
  endTime: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'reminder' | 'overdue' | 'success' | 'info';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface DeviceHistory {
  id: string;
  deviceId: string;
  userId: string;
  userName: string;
  action: 'pickup' | 'return';
  timestamp: Date;
}

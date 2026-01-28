// API service for Kepler TapTrack backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper function for API calls
async function fetchAPI(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Auth API
export const authAPI = {
  login: async (email: string, password: string, role: string) => {
    return fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
  },
  updateProfile: async (id: string, updates: { name?: string; email?: string }) => {
    return fetchAPI('/auth/update-profile', {
      method: 'PUT',
      body: JSON.stringify({ id, ...updates }),
    });
  },
  changePassword: async (id: string, currentPassword: string, newPassword: string) => {
    return fetchAPI('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ id, currentPassword, newPassword }),
    });
  },
};

// Devices API
export const devicesAPI = {
  getAll: async () => {
    return fetchAPI('/devices');
  },
  add: async (deviceId: string) => {
    return fetchAPI('/devices', {
      method: 'POST',
      body: JSON.stringify({ deviceId }),
    });
  },
  update: async (id: string, deviceId: string) => {
    return fetchAPI(`/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ deviceId }),
    });
  },
  remove: async (id: string) => {
    return fetchAPI(`/devices/${id}`, {
      method: 'DELETE',
    });
  },
  pickup: async (id: string, userId: string, userName: string) => {
    return fetchAPI(`/devices/${id}/pickup`, {
      method: 'POST',
      body: JSON.stringify({ userId, userName }),
    });
  },
  return: async (id: string, userId: string, userName: string) => {
    return fetchAPI(`/devices/${id}/return`, {
      method: 'POST',
      body: JSON.stringify({ userId, userName }),
    });
  },
};

// Teachers API
export const teachersAPI = {
  getAll: async () => {
    return fetchAPI('/teachers');
  },
  add: async (teacher: { name: string; email: string; department?: string; courses?: string[] }) => {
    return fetchAPI('/teachers', {
      method: 'POST',
      body: JSON.stringify(teacher),
    });
  },
  remove: async (id: string) => {
    return fetchAPI(`/teachers/${id}`, {
      method: 'DELETE',
    });
  },
  update: async (id: string, teacher: Partial<{ name: string; email: string; department?: string; courses?: string[] }>) => {
    return fetchAPI(`/teachers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(teacher),
    });
  },
  changePassword: async (id: string, currentPassword: string, newPassword: string) => {
    return fetchAPI(`/teachers/${id}/change-password`, {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
  resetPassword: async (id: string) => {
    return fetchAPI(`/teachers/${id}/reset-password`, {
      method: 'PUT',
    });
  },
};

// Timetable API
export const timetableAPI = {
  getAll: async () => {
    return fetchAPI('/timetable');
  },
  getForTeacher: async (teacherId: string) => {
    return fetchAPI(`/timetable/teacher/${teacherId}`);
  },
  add: async (entry: { teacherId: string; teacherName: string; course: string; classroom?: string; day: string; startTime: string; endTime: string }) => {
    return fetchAPI('/timetable', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  },
  update: async (id: string, entry: { teacherId: string; teacherName: string; course: string; classroom?: string; day: string; startTime: string; endTime: string }) => {
    return fetchAPI(`/timetable/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entry),
    });
  },
  remove: async (id: string) => {
    return fetchAPI(`/timetable/${id}`, {
      method: 'DELETE',
    });
  },
};

// History API
export const historyAPI = {
  getAll: async () => {
    return fetchAPI('/history');
  },
};

// Notifications API
export const notificationsAPI = {
  getForUser: async (userId: string) => {
    return fetchAPI(`/notifications/${userId}`);
  },
  markAsRead: async (id: string) => {
    return fetchAPI(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  },
};

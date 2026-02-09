import express from 'express';
import { prisma } from '../index';

const router = express.Router();

// Helper function to check if two time slots are consecutive
function areConsecutive(endTime1: string, startTime2: string): boolean {
  // Convert time strings to minutes (e.g., "10:00" -> 600)
  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const end1 = timeToMinutes(endTime1);
  const start2 = timeToMinutes(startTime2);
  
  // Sessions are consecutive if they're within 5 minutes of each other
  return Math.abs(start2 - end1) <= 5;
}

// Helper function to check and update overdue devices based on timetable
async function checkAndUpdateOverdueDevices() {
  const now = new Date();
  const OVERDUE_BUFFER_MINUTES = 5; // 5 minutes buffer after session ends
  
  // Get current day of week
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = daysOfWeek[now.getDay()];
  
  // Get current time in minutes since midnight
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Find all devices that are in_use
  const devicesInUse = await prisma.device.findMany({
    where: { status: 'in_use' },
  });

  // Helper function to convert time string to minutes
  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Check each device
  for (const device of devicesInUse) {
    if (!device.currentUserId || !device.pickedUpAt) continue;
    
    // Get teacher's timetable for today
    const todaySchedule = await prisma.timetableEntry.findMany({
      where: {
        teacherId: device.currentUserId,
        day: currentDay,
      },
      orderBy: {
        startTime: 'asc',
      },
    });
    
    if (todaySchedule.length === 0) {
      // No schedule today, use simple time-based check (10.5 hours)
      const timeSincePickup = now.getTime() - new Date(device.pickedUpAt).getTime();
      const FALLBACK_THRESHOLD_MS = (10 * 60 + 30) * 60 * 1000;
      
      if (timeSincePickup > FALLBACK_THRESHOLD_MS && device.status !== 'overdue') {
        await prisma.device.update({
          where: { id: device.id },
          data: { status: 'overdue' },
        });
      }
      continue;
    }
    
    // NEW LOGIC: Check EACH session independently
    // For every session that has ended, check if 5 minutes have passed
    // If yes, and device not returned, flag as overdue
    let shouldBeOverdue = false;
    
    for (const session of todaySchedule) {
      const sessionEndMinutes = timeToMinutes(session.endTime);
      const minutesSinceSessionEnd = currentMinutes - sessionEndMinutes;
      
      // If ANY session has ended and more than 5 minutes have passed
      if (minutesSinceSessionEnd > OVERDUE_BUFFER_MINUTES) {
        shouldBeOverdue = true;
        break; // No need to check further, already overdue
      }
    }
    
    // Update device status if it should be overdue
    if (shouldBeOverdue && device.status !== 'overdue') {
      await prisma.device.update({
        where: { id: device.id },
        data: { status: 'overdue' },
      });
    }
  }
}

// Get all devices
router.get('/', async (req, res) => {
  try {
    // Check and update overdue devices before fetching
    await checkAndUpdateOverdueDevices();

    const devices = await prisma.device.findMany({
      orderBy: { deviceId: 'asc' },
    });
    res.json(devices);
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// Add device
router.post('/', async (req, res) => {
  try {
    const { deviceId } = req.body;
    const device = await prisma.device.create({
      data: {
        deviceId,
        status: 'available',
      },
    });
    res.json(device);
  } catch (error) {
    console.error('Add device error:', error);
    res.status(500).json({ error: 'Failed to add device' });
  }
});

// Update device
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { deviceId } = req.body;
    
    const device = await prisma.device.update({
      where: { id },
      data: { deviceId },
    });
    
    res.json(device);
  } catch (error) {
    console.error('Update device error:', error);
    res.status(500).json({ error: 'Failed to update device' });
  }
});

// Remove device
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.device.delete({
      where: { id },
    });
    res.json({ message: 'Device deleted successfully' });
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ error: 'Failed to delete device' });
  }
});

// Pickup device
router.post('/:id/pickup', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userName } = req.body;

    const now = new Date();
    
    // Get teacher's schedule for today to calculate expected return
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = daysOfWeek[now.getDay()];
    
    const todaySchedule = await prisma.timetableEntry.findMany({
      where: {
        teacherId: userId,
        day: currentDay,
      },
      orderBy: {
        endTime: 'desc',
      },
    });
    
    let expectedReturn: Date;
    
    if (todaySchedule.length > 0) {
      // Use the last class end time + 5 minutes as expected return
      const lastClassEndTime = todaySchedule[0].endTime;
      const [hours, minutes] = lastClassEndTime.split(':').map(Number);
      
      expectedReturn = new Date(now);
      expectedReturn.setHours(hours, minutes + 5, 0, 0);
    } else {
      // Fallback to 10.5 hours if no schedule
      expectedReturn = new Date(now.getTime() + (10 * 60 + 30) * 60 * 1000);
    }

    const device = await prisma.device.update({
      where: { id },
      data: {
        status: 'in_use',
        currentUserId: userId,
        currentUserName: userName,
        pickedUpAt: now,
        expectedReturnAt: expectedReturn,
      },
    });

    // Check for recent duplicate history entry (within last 5 seconds)
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const recentHistory = await prisma.deviceHistory.findFirst({
      where: {
        deviceId: id,
        userId,
        action: 'pickup',
        timestamp: {
          gte: fiveSecondsAgo,
        },
      },
    });

    // Only create history entry if no recent duplicate exists
    if (!recentHistory) {
      await prisma.deviceHistory.create({
        data: {
          deviceId: id,
          userId,
          userName,
          action: 'pickup',
        },
      });
    } else {
      console.log('Skipping duplicate pickup history entry for device:', id);
    }

    res.json(device);
  } catch (error) {
    console.error('Pickup device error:', error);
    res.status(500).json({ error: 'Failed to pickup device' });
  }
});

// Return device
router.post('/:id/return', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userName } = req.body;

    const device = await prisma.device.update({
      where: { id },
      data: {
        status: 'available',
        currentUserId: null,
        currentUserName: null,
        pickedUpAt: null,
        expectedReturnAt: null,
        lastReturnedAt: new Date(),
        lastUserId: userId,
        lastUserName: userName,
      },
    });

    // Check for recent duplicate history entry (within last 5 seconds)
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    const recentHistory = await prisma.deviceHistory.findFirst({
      where: {
        deviceId: id,
        userId,
        action: 'return',
        timestamp: {
          gte: fiveSecondsAgo,
        },
      },
    });

    // Only create history entry if no recent duplicate exists
    if (!recentHistory) {
      await prisma.deviceHistory.create({
        data: {
          deviceId: id,
          userId,
          userName,
          action: 'return',
        },
      });
    } else {
      console.log('Skipping duplicate return history entry for device:', id);
    }

    res.json(device);
  } catch (error) {
    console.error('Return device error:', error);
    res.status(500).json({ error: 'Failed to return device' });
  }
});

export default router;

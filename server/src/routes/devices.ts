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
  const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  console.log(`\n[OVERDUE CHECK] Running at ${currentTimeStr} on ${currentDay}`);
  
  // Find all devices that are in_use
  const devicesInUse = await prisma.device.findMany({
    where: { status: 'in_use' },
  });

  console.log(`[OVERDUE CHECK] Found ${devicesInUse.length} devices in use`);

  // Helper function to convert time string to minutes
  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Check each device
  for (const device of devicesInUse) {
    if (!device.currentUserId || !device.pickedUpAt) {
      console.log(`[OVERDUE CHECK] Skipping device ${device.deviceId} - missing userId or pickedUpAt`);
      continue;
    }
    
    console.log(`\n[OVERDUE CHECK] Checking device ${device.deviceId} (User: ${device.currentUserName})`);
    
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
    
    console.log(`[OVERDUE CHECK] Teacher has ${todaySchedule.length} sessions today (${currentDay})`);
    
    if (todaySchedule.length === 0) {
      // No schedule today, use simple time-based check (10.5 hours)
      const timeSincePickup = now.getTime() - new Date(device.pickedUpAt).getTime();
      const FALLBACK_THRESHOLD_MS = (10 * 60 + 30) * 60 * 1000;
      const hoursSincePickup = (timeSincePickup / (60 * 60 * 1000)).toFixed(2);
      
      console.log(`[OVERDUE CHECK] No schedule - using fallback (10.5 hours). Time since pickup: ${hoursSincePickup} hours`);
      
      if (timeSincePickup > FALLBACK_THRESHOLD_MS && device.status !== 'overdue') {
        console.log(`[OVERDUE CHECK] ✓ FLAGGING AS OVERDUE (fallback threshold exceeded)`);
        await prisma.device.update({
          where: { id: device.id },
          data: { status: 'overdue' },
        });
      } else {
        console.log(`[OVERDUE CHECK] Not overdue yet (fallback)`);
      }
      continue;
    }
    
    // Log all sessions for debugging
    todaySchedule.forEach((session, idx) => {
      console.log(`[OVERDUE CHECK]   Session ${idx + 1}: ${session.startTime} - ${session.endTime} (${session.course})`);
    });
    
    // FIXED LOGIC: Only flag as overdue after the LAST session ends
    // Find the last session's end time
    const lastSession = todaySchedule[todaySchedule.length - 1]; // Already sorted by startTime
    const lastSessionEndMinutes = timeToMinutes(lastSession.endTime);
    const minutesSinceLastSessionEnd = currentMinutes - lastSessionEndMinutes;
    
    console.log(`[OVERDUE CHECK] Last session ends at: ${lastSession.endTime}`);
    console.log(`[OVERDUE CHECK] Current time: ${currentTimeStr} (${currentMinutes} mins since midnight)`);
    console.log(`[OVERDUE CHECK] Last session end: ${lastSession.endTime} (${lastSessionEndMinutes} mins since midnight)`);
    console.log(`[OVERDUE CHECK] Minutes since last session ended: ${minutesSinceLastSessionEnd}`);
    console.log(`[OVERDUE CHECK] Buffer required: ${OVERDUE_BUFFER_MINUTES} minutes`);
    
    // Device is overdue only if the LAST session has ended and buffer time has passed
    const shouldBeOverdue = minutesSinceLastSessionEnd > OVERDUE_BUFFER_MINUTES;
    
    console.log(`[OVERDUE CHECK] Should be overdue? ${shouldBeOverdue}`);
    
    // Update device status if it should be overdue
    if (shouldBeOverdue && device.status !== 'overdue') {
      console.log(`[OVERDUE CHECK] ✓ FLAGGING AS OVERDUE`);
      await prisma.device.update({
        where: { id: device.id },
        data: { status: 'overdue' },
      });
    } else if (shouldBeOverdue) {
      console.log(`[OVERDUE CHECK] Already marked as overdue`);
    } else {
      console.log(`[OVERDUE CHECK] Not overdue yet - still within buffer time or session ongoing`);
    }
  }
  
  console.log(`[OVERDUE CHECK] Check complete\n`);
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

    // Check for recent duplicate history entry (within last 30 seconds)
    const thirtySecondsAgo = new Date(Date.now() - 30000);
    const recentHistory = await prisma.deviceHistory.findFirst({
      where: {
        deviceId: id,
        userId,
        action: 'pickup',
        timestamp: {
          gte: thirtySecondsAgo,
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
      console.log('Created pickup history entry for device:', id, 'user:', userName);
    } else {
      console.log('Skipping duplicate pickup history entry for device:', id, 'user:', userName, 'within 30 seconds');
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

    // Check for recent duplicate history entry (within last 30 seconds)
    const thirtySecondsAgo = new Date(Date.now() - 30000);
    const recentHistory = await prisma.deviceHistory.findFirst({
      where: {
        deviceId: id,
        userId,
        action: 'return',
        timestamp: {
          gte: thirtySecondsAgo,
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
      console.log('Created return history entry for device:', id, 'user:', userName);
    } else {
      console.log('Skipping duplicate return history entry for device:', id, 'user:', userName, 'within 30 seconds');
    }

    res.json(device);
  } catch (error) {
    console.error('Return device error:', error);
    res.status(500).json({ error: 'Failed to return device' });
  }
});

export default router;

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
      // No schedule today - teacher shouldn't have device, use short fallback (1 hour)
      const timeSincePickup = now.getTime() - new Date(device.pickedUpAt).getTime();
      const FALLBACK_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour
      const hoursSincePickup = (timeSincePickup / (60 * 60 * 1000)).toFixed(2);
      
      console.log(`[OVERDUE CHECK] No schedule today - using 1-hour fallback. Time since pickup: ${hoursSincePickup} hours`);
      
      if (timeSincePickup > FALLBACK_THRESHOLD_MS && device.status !== 'overdue') {
        console.log(`[OVERDUE CHECK] ✓ FLAGGING AS OVERDUE (no classes today, exceeded 1-hour limit)`);
        await prisma.device.update({
          where: { id: device.id },
          data: { status: 'overdue' },
        });
      } else {
        console.log(`[OVERDUE CHECK] Not overdue yet (within 1-hour fallback)`);
      }
      continue;
    }
    
    // Log all sessions for debugging
    todaySchedule.forEach((session, idx) => {
      console.log(`[OVERDUE CHECK]   Session ${idx + 1}: ${session.startTime} - ${session.endTime} (${session.course})`);
    });
    
    // NEW LOGIC: Flag as overdue if ANY session has ended + buffer, and no current session is ongoing
    // Step 1: Check if there's a session happening RIGHT NOW
    let currentSession = null;
    for (const session of todaySchedule) {
      const sessionStartMinutes = timeToMinutes(session.startTime);
      const sessionEndMinutes = timeToMinutes(session.endTime);
      
      if (currentMinutes >= sessionStartMinutes && currentMinutes <= sessionEndMinutes) {
        currentSession = session;
        break;
      }
    }
    
    console.log(`[OVERDUE CHECK] Current time: ${currentTimeStr} (${currentMinutes} mins since midnight)`);
    
    if (currentSession) {
      // Teacher is currently in a session - NOT overdue
      console.log(`[OVERDUE CHECK] Teacher is IN SESSION: ${currentSession.startTime} - ${currentSession.endTime}`);
      console.log(`[OVERDUE CHECK] Not overdue - session ongoing`);
    } else {
      // No current session - check if any past session has ended
      console.log(`[OVERDUE CHECK] No session currently ongoing`);
      
      // Find all sessions that have already ended
      const endedSessions = todaySchedule.filter(session => {
        const sessionEndMinutes = timeToMinutes(session.endTime);
        return currentMinutes > sessionEndMinutes;
      });
      
      if (endedSessions.length > 0) {
        // Get the most recent ended session
        const lastEndedSession = endedSessions[endedSessions.length - 1];
        const lastEndedSessionEndMinutes = timeToMinutes(lastEndedSession.endTime);
        const minutesSinceEnded = currentMinutes - lastEndedSessionEndMinutes;
        
        console.log(`[OVERDUE CHECK] Last ended session: ${lastEndedSession.startTime} - ${lastEndedSession.endTime}`);
        console.log(`[OVERDUE CHECK] Minutes since session ended: ${minutesSinceEnded}`);
        console.log(`[OVERDUE CHECK] Buffer required: ${OVERDUE_BUFFER_MINUTES} minutes`);
        
        const shouldBeOverdue = minutesSinceEnded > OVERDUE_BUFFER_MINUTES;
        console.log(`[OVERDUE CHECK] Should be overdue? ${shouldBeOverdue}`);
        
        if (shouldBeOverdue && device.status !== 'overdue') {
          console.log(`[OVERDUE CHECK] ✓ FLAGGING AS OVERDUE`);
          await prisma.device.update({
            where: { id: device.id },
            data: { status: 'overdue' },
          });
        } else if (shouldBeOverdue) {
          console.log(`[OVERDUE CHECK] Already marked as overdue`);
        } else {
          console.log(`[OVERDUE CHECK] Not overdue yet - within ${OVERDUE_BUFFER_MINUTES} minute buffer`);
        }
      } else {
        // No sessions have ended yet today
        console.log(`[OVERDUE CHECK] No sessions have ended yet today - not overdue`);
      }
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

    // Use a transaction to ensure atomic operation and prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Check for recent duplicate history entry (within last 2 minutes) using transaction
      const twoMinutesAgo = new Date(Date.now() - 120000);
      const recentHistory = await tx.deviceHistory.findFirst({
        where: {
          deviceId: id,
          userId,
          action: 'pickup',
          timestamp: {
            gte: twoMinutesAgo,
          },
        },
      });

      // If duplicate exists, don't create another entry but still update device status
      if (recentHistory) {
        console.log('Skipping duplicate pickup history entry for device:', id, 'user:', userName, 'within 2 minutes');
        
        // Still update device status in case it wasn't updated
        const device = await tx.device.update({
          where: { id },
          data: {
            status: 'in_use',
            currentUserId: userId,
            currentUserName: userName,
            pickedUpAt: now,
            expectedReturnAt: expectedReturn,
          },
        });
        
        return device;
      }

      // No recent duplicate - create history entry and update device
      const device = await tx.device.update({
        where: { id },
        data: {
          status: 'in_use',
          currentUserId: userId,
          currentUserName: userName,
          pickedUpAt: now,
          expectedReturnAt: expectedReturn,
        },
      });

      await tx.deviceHistory.create({
        data: {
          deviceId: id,
          userId,
          userName,
          action: 'pickup',
        },
      });
      
      console.log('Created pickup history entry for device:', id, 'user:', userName);
      
      return device;
    });

    res.json(result);
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

    // Use a transaction to ensure atomic operation and prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Check for recent duplicate history entry (within last 2 minutes) using transaction
      const twoMinutesAgo = new Date(Date.now() - 120000);
      const recentHistory = await tx.deviceHistory.findFirst({
        where: {
          deviceId: id,
          userId,
          action: 'return',
          timestamp: {
            gte: twoMinutesAgo,
          },
        },
      });

      // If duplicate exists, don't create another entry but still update device status
      if (recentHistory) {
        console.log('Skipping duplicate return history entry for device:', id, 'user:', userName, 'within 2 minutes');
        
        // Still update device status in case it wasn't updated
        const device = await tx.device.update({
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
        
        return device;
      }

      // No recent duplicate - create history entry and update device
      const device = await tx.device.update({
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

      await tx.deviceHistory.create({
        data: {
          deviceId: id,
          userId,
          userName,
          action: 'return',
        },
      });
      
      console.log('Created return history entry for device:', id, 'user:', userName);
      
      return device;
    });

    res.json(result);
  } catch (error) {
    console.error('Return device error:', error);
    res.status(500).json({ error: 'Failed to return device' });
  }
});

export default router;

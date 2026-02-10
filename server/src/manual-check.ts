import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function manualCheck() {
  const now = new Date();
  const OVERDUE_BUFFER_MINUTES = 5;
  
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = daysOfWeek[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  console.log(`Current Day: ${currentDay}`);
  console.log(`Current Time: ${currentTimeStr} (${currentMinutes} minutes)`);
  console.log();
  
  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const devicesInUse = await prisma.device.findMany({
    where: { status: 'in_use' }
  });
  
  console.log(`Found ${devicesInUse.length} devices in use\n`);
  
  for (const device of devicesInUse) {
    console.log(`=== Device: ${device.deviceId} ===`);
    console.log(`User: ${device.currentUserName}`);
    console.log(`UserId: ${device.currentUserId}`);
    
    if (!device.currentUserId) {
      console.log('ERROR: No currentUserId');
      continue;
    }
    
    const todaySchedule = await prisma.timetableEntry.findMany({
      where: {
        teacherId: device.currentUserId,
        day: currentDay
      },
      orderBy: {
        startTime: 'asc'
      }
    });
    
    console.log(`Schedule: ${todaySchedule.length} sessions`);
    todaySchedule.forEach((s, i) => {
      console.log(`  ${i+1}. ${s.startTime}-${s.endTime}: ${s.course}`);
    });
    
    if (todaySchedule.length === 0) {
      console.log('No schedule today - checking 1-hour fallback');
      const timeSincePickup = now.getTime() - new Date(device.pickedUpAt!).getTime();
      const FALLBACK_MS = 60 * 60 * 1000; // 1 hour
      const hoursSince = (timeSincePickup / (60 * 60 * 1000)).toFixed(2);
      
      console.log(`Hours since pickup: ${hoursSince}`);
      console.log(`Fallback threshold: 1 hour`);
      
      if (timeSincePickup > FALLBACK_MS) {
        console.log('FLAGGING AS OVERDUE (no classes today)...');
        await prisma.device.update({
          where: { id: device.id },
          data: { status: 'overdue' }
        });
        console.log('DONE - Device marked as overdue\n');
      } else {
        console.log('Not overdue yet (within 1-hour fallback)\n');
      }
      continue;
    }
    
    // Check current session
    let currentSession = null;
    for (const session of todaySchedule) {
      const startMins = timeToMinutes(session.startTime);
      const endMins = timeToMinutes(session.endTime);
      if (currentMinutes >= startMins && currentMinutes <= endMins) {
        currentSession = session;
        break;
      }
    }
    
    if (currentSession) {
      console.log(`Currently in session: ${currentSession.startTime}-${currentSession.endTime}`);
      console.log('NOT OVERDUE\n');
    } else {
      const endedSessions = todaySchedule.filter(session => {
        const sessionEndMinutes = timeToMinutes(session.endTime);
        return currentMinutes > sessionEndMinutes;
      });
      
      if (endedSessions.length > 0) {
        const lastEnded = endedSessions[endedSessions.length - 1];
        const lastEndedMins = timeToMinutes(lastEnded.endTime);
        const minsSinceEnded = currentMinutes - lastEndedMins;
        
        console.log(`Last ended session: ${lastEnded.startTime}-${lastEnded.endTime}`);
        console.log(`Minutes since ended: ${minsSinceEnded}`);
        console.log(`Buffer: ${OVERDUE_BUFFER_MINUTES} minutes`);
        console.log(`Should be overdue: ${minsSinceEnded > OVERDUE_BUFFER_MINUTES}`);
        
        if (minsSinceEnded > OVERDUE_BUFFER_MINUTES) {
          console.log('FLAGGING AS OVERDUE NOW...');
          await prisma.device.update({
            where: { id: device.id },
            data: { status: 'overdue' }
          });
          console.log('DONE - Device marked as overdue');
        }
      } else {
        console.log('No sessions ended yet');
      }
    }
    console.log();
  }
  
  await prisma.$disconnect();
}

manualCheck().catch(console.error);

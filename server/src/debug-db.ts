import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  const now = new Date();
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = daysOfWeek[now.getDay()];
  const currentTime = `${now.getHours()}:${now.getMinutes()}`;
  
  console.log(`Current Day: ${currentDay}`);
  console.log(`Current Time: ${currentTime}\n`);
  
  const devicesInUse = await prisma.device.findMany({
    where: { status: 'in_use' }
  });
  
  const devicesOverdue = await prisma.device.findMany({
    where: { status: 'overdue' }
  });
  
  console.log(`Devices in use: ${devicesInUse.length}`);
  console.log(`Devices overdue: ${devicesOverdue.length}\n`);
  
  for (const device of devicesOverdue) {
    console.log(`\nOVERDUE Device: ${device.deviceId}`);
    console.log(`  User: ${device.currentUserName}`);
    console.log(`  Picked up: ${device.pickedUpAt}`);
  }
  
  console.log('\n--- In Use Devices ---\n');
  
  for (const device of devicesInUse) {
    console.log(`\nDevice: ${device.deviceId}`);
    console.log(`  User: ${device.currentUserName}`);
    console.log(`  UserId: ${device.currentUserId}`);
    console.log(`  Picked up: ${device.pickedUpAt}`);
    
    if (device.currentUserId) {
      const schedule = await prisma.timetableEntry.findMany({
        where: {
          teacherId: device.currentUserId,
          day: currentDay
        }
      });
      
      console.log(`  Schedule for ${currentDay}: ${schedule.length} sessions`);
      schedule.forEach(s => {
        console.log(`    - ${s.startTime}-${s.endTime}: ${s.course}`);
      });
    }
  }
  
  await prisma.$disconnect();
}

checkDatabase().catch(console.error);

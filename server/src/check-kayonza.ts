import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const device = await prisma.device.findFirst({
    where: { deviceId: 'TAP-KAYONZA' }
  });
  
  console.log('TAP-KAYONZA Details:');
  console.log(`  Status: ${device?.status}`);
  console.log(`  Picked up at: ${device?.pickedUpAt}`);
  console.log(`  Expected return: ${device?.expectedReturnAt}`);
  console.log(`  Current user: ${device?.currentUserName}`);
  console.log(`  User ID: ${device?.currentUserId}`);
  
  if (device?.expectedReturnAt) {
    const now = new Date();
    const expected = new Date(device.expectedReturnAt);
    const diff = now.getTime() - expected.getTime();
    const hours = diff / (1000 * 60 * 60);
    console.log(`\n  Time since expected return: ${hours.toFixed(2)} hours`);
    console.log(`  Is overdue by expected return? ${now > expected}`);
  }
  
  // Check schedule for other days
  if (device?.currentUserId) {
    const allSchedule = await prisma.timetableEntry.findMany({
      where: { teacherId: device.currentUserId }
    });
    
    console.log(`\n  Total schedule entries: ${allSchedule.length}`);
    allSchedule.forEach(s => {
      console.log(`    ${s.day} ${s.startTime}-${s.endTime}: ${s.course}`);
    });
  }
  
  await prisma.$disconnect();
}

check().catch(console.error);

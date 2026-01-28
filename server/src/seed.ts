import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.deviceHistory.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.device.deleteMany();
  await prisma.timetableEntry.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      name: 'Dr. Sarah Johnson',
      email: 'admin@kepler.edu',
      password: adminPassword,
      role: 'super_admin',
      department: 'Administration',
    },
  });

  // Create teachers
  const teacherPassword = await bcrypt.hash('teacher123', 10);
  const teachers = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Prof. James Mugabo',
        email: 'teacher@kepler.edu',
        password: teacherPassword,
        role: 'teacher',
        department: 'Computer Science',
        courses: JSON.stringify(['Introduction to Programming', 'Data Structures']),
      },
    }),
    prisma.user.create({
      data: {
        name: 'Dr. Marie Claire',
        email: 'marie.claire@kepler.edu',
        password: teacherPassword,
        role: 'teacher',
        department: 'Business',
        courses: JSON.stringify(['Marketing Fundamentals', 'Entrepreneurship']),
      },
    }),
    prisma.user.create({
      data: {
        name: 'Prof. Emmanuel Nziza',
        email: 'emmanuel.nziza@kepler.edu',
        password: teacherPassword,
        role: 'teacher',
        department: 'Mathematics',
        courses: JSON.stringify(['Calculus I', 'Linear Algebra']),
      },
    }),
    prisma.user.create({
      data: {
        name: 'Dr. Aline Uwimana',
        email: 'aline.uwimana@kepler.edu',
        password: teacherPassword,
        role: 'teacher',
        department: 'Health Sciences',
        courses: JSON.stringify(['Public Health', 'Epidemiology']),
      },
    }),
    prisma.user.create({
      data: {
        name: 'Prof. David Habimana',
        email: 'david.habimana@kepler.edu',
        password: teacherPassword,
        role: 'teacher',
        department: 'Engineering',
        courses: JSON.stringify(['Electronics', 'Circuit Design']),
      },
    }),
  ]);

  // Create devices
  const devices = await Promise.all([
    prisma.device.create({ data: { deviceId: 'TAP-001', status: 'available' } }),
    prisma.device.create({ data: { deviceId: 'TAP-002', status: 'available' } }),
    prisma.device.create({
      data: {
        deviceId: 'TAP-003',
        status: 'in_use',
        currentUserId: teachers[1].id,
        currentUserName: teachers[1].name,
        pickedUpAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        expectedReturnAt: new Date(Date.now()),
      },
    }),
    prisma.device.create({ data: { deviceId: 'TAP-004', status: 'available' } }),
    prisma.device.create({
      data: {
        deviceId: 'TAP-005',
        status: 'overdue',
        currentUserId: teachers[2].id,
        currentUserName: teachers[2].name,
        pickedUpAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
        expectedReturnAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      },
    }),
    prisma.device.create({ data: { deviceId: 'TAP-006', status: 'available' } }),
    prisma.device.create({
      data: {
        deviceId: 'TAP-007',
        status: 'in_use',
        currentUserId: teachers[3].id,
        currentUserName: teachers[3].name,
        pickedUpAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        expectedReturnAt: new Date(Date.now() + 1 * 60 * 60 * 1000),
      },
    }),
    prisma.device.create({ data: { deviceId: 'TAP-008', status: 'available' } }),
    prisma.device.create({ data: { deviceId: 'TAP-009', status: 'available' } }),
    prisma.device.create({ data: { deviceId: 'TAP-010', status: 'available' } }),
  ]);

  // Create timetable entries
  await Promise.all([
    prisma.timetableEntry.create({
      data: {
        teacherId: teachers[0].id,
        teacherName: teachers[0].name,
        course: 'Introduction to Programming',
        day: 'Monday',
        startTime: '08:00',
        endTime: '10:00',
      },
    }),
    prisma.timetableEntry.create({
      data: {
        teacherId: teachers[0].id,
        teacherName: teachers[0].name,
        course: 'Data Structures',
        day: 'Wednesday',
        startTime: '14:00',
        endTime: '16:00',
      },
    }),
    prisma.timetableEntry.create({
      data: {
        teacherId: teachers[1].id,
        teacherName: teachers[1].name,
        course: 'Marketing Fundamentals',
        day: 'Tuesday',
        startTime: '10:00',
        endTime: '12:00',
      },
    }),
    prisma.timetableEntry.create({
      data: {
        teacherId: teachers[2].id,
        teacherName: teachers[2].name,
        course: 'Calculus I',
        day: 'Monday',
        startTime: '10:00',
        endTime: '12:00',
      },
    }),
    prisma.timetableEntry.create({
      data: {
        teacherId: teachers[3].id,
        teacherName: teachers[3].name,
        course: 'Public Health',
        day: 'Thursday',
        startTime: '08:00',
        endTime: '10:00',
      },
    }),
  ]);

  console.log('✅ Database seeded successfully!');
  console.log(`📧 Admin: admin@kepler.edu / admin123`);
  console.log(`📧 Teacher: teacher@kepler.edu / teacher123`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

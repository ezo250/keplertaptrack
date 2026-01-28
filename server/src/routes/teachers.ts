import express from 'express';
import { prisma } from '../index';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = express.Router();

// Helper function to generate random password
function generatePassword(length = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  
  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }
  
  return password;
}

// Get all teachers
router.get('/', async (req, res) => {
  try {
    const teachers = await prisma.user.findMany({
      where: { role: 'teacher' },
      orderBy: { name: 'asc' },
    });

    const teachersWithoutPassword = teachers.map(({ password, ...teacher }) => ({
      ...teacher,
      courses: teacher.courses ? JSON.parse(teacher.courses) : undefined,
    }));

    res.json(teachersWithoutPassword);
  } catch (error) {
    console.error('Get teachers error:', error);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

// Add teacher
router.post('/', async (req, res) => {
  try {
    const { name, email, department, courses } = req.body;

    // Generate random password
    const generatedPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    const teacher = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'teacher',
        department,
        courses: courses ? JSON.stringify(courses) : null,
      },
    });

    const { password, ...teacherWithoutPassword } = teacher;
    res.json({
      ...teacherWithoutPassword,
      courses: teacher.courses ? JSON.parse(teacher.courses) : undefined,
      // Send the generated password back to show to admin
      generatedPassword,
    });
  } catch (error) {
    console.error('Add teacher error:', error);
    res.status(500).json({ error: 'Failed to add teacher' });
  }
});

// Remove teacher
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({
      where: { id },
    });
    res.json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    console.error('Delete teacher error:', error);
    res.status(500).json({ error: 'Failed to delete teacher' });
  }
});

// Update teacher
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, department, courses } = req.body;

    const teacher = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        department,
        courses: courses ? JSON.stringify(courses) : null,
      },
    });

    const { password, ...teacherWithoutPassword } = teacher;
    res.json({
      ...teacherWithoutPassword,
      courses: teacher.courses ? JSON.parse(teacher.courses) : undefined,
    });
  } catch (error) {
    console.error('Update teacher error:', error);
    res.status(500).json({ error: 'Failed to update teacher' });
  }
});

// Change password (for teachers)
router.put('/:id/change-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Reset password (for admin to reset teacher's password)
router.put('/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate new random password
    const generatedPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    // Return the generated password to show to admin
    res.json({ 
      message: 'Password reset successfully',
      generatedPassword,
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

export default router;

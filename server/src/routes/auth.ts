import express from 'express';
import { prisma } from '../index';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.role !== role) {
      return res.status(401).json({ error: 'Invalid role' });
    }

    // Don't send password back
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      user: {
        ...userWithoutPassword,
        courses: user.courses ? JSON.parse(user.courses) : undefined,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Update profile (name and email)
router.put('/update-profile', async (req, res) => {
  try {
    const { id, name, email } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    const { password: _, ...userWithoutPassword } = user;
    res.json({
      user: {
        ...userWithoutPassword,
        courses: user.courses ? JSON.parse(user.courses) : undefined,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.put('/change-password', async (req, res) => {
  try {
    const { id, currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

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

export default router;

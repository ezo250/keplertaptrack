import express from 'express';
import { prisma } from '../index';

const router = express.Router();

// Get all devices
router.get('/', async (req, res) => {
  try {
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
    const expectedReturn = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours

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

    // Create history entry
    await prisma.deviceHistory.create({
      data: {
        deviceId: id,
        userId,
        userName,
        action: 'pickup',
      },
    });

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

    // Create history entry
    await prisma.deviceHistory.create({
      data: {
        deviceId: id,
        userId,
        userName,
        action: 'return',
      },
    });

    res.json(device);
  } catch (error) {
    console.error('Return device error:', error);
    res.status(500).json({ error: 'Failed to return device' });
  }
});

export default router;

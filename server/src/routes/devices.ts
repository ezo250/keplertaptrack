import express from 'express';
import { prisma } from '../index';

const router = express.Router();

// Helper function to check and update overdue devices
async function checkAndUpdateOverdueDevices() {
  const now = new Date();
  const OVERDUE_THRESHOLD_MS = (10 * 60 + 30) * 60 * 1000; // 10 hours 30 minutes in milliseconds

  // Find all devices that are in_use
  const devicesInUse = await prisma.device.findMany({
    where: { status: 'in_use' },
  });

  // Check each device and update if overdue
  for (const device of devicesInUse) {
    if (device.pickedUpAt) {
      const timeSincePickup = now.getTime() - new Date(device.pickedUpAt).getTime();
      
      if (timeSincePickup > OVERDUE_THRESHOLD_MS && device.status !== 'overdue') {
        await prisma.device.update({
          where: { id: device.id },
          data: { status: 'overdue' },
        });
      }
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
    const expectedReturn = new Date(now.getTime() + (10 * 60 + 30) * 60 * 1000); // 10 hours 30 minutes

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

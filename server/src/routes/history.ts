import express from 'express';
import { prisma } from '../index';

const router = express.Router();

// Get all device history
router.get('/', async (req, res) => {
  try {
    const history = await prisma.deviceHistory.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100, // Limit to last 100 entries
    });
    res.json(history);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;

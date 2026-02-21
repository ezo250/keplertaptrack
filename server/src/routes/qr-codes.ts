import express from 'express';
import { prisma } from '../index';

const router = express.Router();

// Get all QR codes
router.get('/', async (req, res) => {
  try {
    const qrCodes = await prisma.qRCode.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(qrCodes);
  } catch (error) {
    console.error('Get QR codes error:', error);
    res.status(500).json({ error: 'Failed to fetch QR codes' });
  }
});

// Get active QR code for a specific type
router.get('/active/:type', async (req, res) => {
  try {
    const { type } = req.params;
    
    if (type !== 'pickup' && type !== 'return') {
      return res.status(400).json({ error: 'Invalid type. Must be "pickup" or "return"' });
    }

    const qrCode = await prisma.qRCode.findFirst({
      where: {
        type,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!qrCode) {
      return res.status(404).json({ error: `No active ${type} QR code found` });
    }

    res.json(qrCode);
  } catch (error) {
    console.error('Get active QR code error:', error);
    res.status(500).json({ error: 'Failed to fetch active QR code' });
  }
});

// Generate new QR code
router.post('/generate', async (req, res) => {
  try {
    const { type, validUntil } = req.body;

    if (type !== 'pickup' && type !== 'return') {
      return res.status(400).json({ error: 'Invalid type. Must be "pickup" or "return"' });
    }

    // Deactivate all existing QR codes of this type
    await prisma.qRCode.updateMany({
      where: { type, isActive: true },
      data: { isActive: false },
    });

    // Generate new code
    const code = `KEPLER_${type.toUpperCase()}_AUTH_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const qrCode = await prisma.qRCode.create({
      data: {
        code,
        type,
        isActive: true,
        validUntil: validUntil ? new Date(validUntil) : null,
      },
    });

    res.json(qrCode);
  } catch (error) {
    console.error('Generate QR code error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Update QR code
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { validUntil } = req.body;

    const qrCode = await prisma.qRCode.update({
      where: { id },
      data: {
        validUntil: validUntil ? new Date(validUntil) : null,
      },
    });

    res.json(qrCode);
  } catch (error) {
    console.error('Update QR code error:', error);
    res.status(500).json({ error: 'Failed to update QR code' });
  }
});

// Deactivate QR code
router.put('/:id/deactivate', async (req, res) => {
  try {
    const { id } = req.params;

    const qrCode = await prisma.qRCode.update({
      where: { id },
      data: { isActive: false },
    });

    res.json(qrCode);
  } catch (error) {
    console.error('Deactivate QR code error:', error);
    res.status(500).json({ error: 'Failed to deactivate QR code' });
  }
});

export default router;

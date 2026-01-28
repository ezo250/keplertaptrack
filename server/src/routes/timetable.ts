import express from 'express';
import { prisma } from '../index';

const router = express.Router();

// Get all timetable entries
router.get('/', async (req, res) => {
  try {
    const entries = await prisma.timetableEntry.findMany({
      orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
    });
    res.json(entries);
  } catch (error) {
    console.error('Get timetable error:', error);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
});

// Get timetable for a specific teacher
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    const entries = await prisma.timetableEntry.findMany({
      where: { teacherId },
      orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
    });
    res.json(entries);
  } catch (error) {
    console.error('Get teacher timetable error:', error);
    res.status(500).json({ error: 'Failed to fetch teacher timetable' });
  }
});

// Add timetable entry
router.post('/', async (req, res) => {
  try {
    const { teacherId, teacherName, course, classroom, day, startTime, endTime } = req.body;

    const entry = await prisma.timetableEntry.create({
      data: {
        teacherId,
        teacherName,
        course,
        classroom,
        day,
        startTime,
        endTime,
      },
    });

    res.json(entry);
  } catch (error) {
    console.error('Add timetable entry error:', error);
    res.status(500).json({ error: 'Failed to add timetable entry' });
  }
});

// Update timetable entry
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { teacherId, teacherName, course, classroom, day, startTime, endTime } = req.body;

    const entry = await prisma.timetableEntry.update({
      where: { id },
      data: {
        teacherId,
        teacherName,
        course,
        classroom,
        day,
        startTime,
        endTime,
      },
    });

    res.json(entry);
  } catch (error) {
    console.error('Update timetable entry error:', error);
    res.status(500).json({ error: 'Failed to update timetable entry' });
  }
});

// Delete timetable entry
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.timetableEntry.delete({
      where: { id },
    });
    res.json({ message: 'Timetable entry deleted successfully' });
  } catch (error) {
    console.error('Delete timetable entry error:', error);
    res.status(500).json({ error: 'Failed to delete timetable entry' });
  }
});

export default router;

import express from 'express';
import { prisma } from '../index';

const router = express.Router();

interface UploadEntry {
  teacherId: string;
  teacherName: string;
  course: string;
  classroom?: string;
  day: string;
  startTime: string;
  endTime: string;
}

interface ComparisonResult {
  new: UploadEntry[];
  conflicts: Array<{
    uploaded: UploadEntry;
    existing: any;
    conflictType: 'time_overlap' | 'different_course';
  }>;
  duplicates: Array<{
    uploaded: UploadEntry;
    existing: any;
  }>;
  updates: Array<{
    uploaded: UploadEntry;
    existing: any;
  }>;
}

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

// Compare uploaded entries with existing timetable
router.post('/compare', async (req, res) => {
  try {
    const uploadedEntries: UploadEntry[] = req.body.entries;

    if (!uploadedEntries || !Array.isArray(uploadedEntries)) {
      return res.status(400).json({ error: 'Invalid entries format' });
    }

    // Fetch all existing timetable entries
    const existingEntries = await prisma.timetableEntry.findMany();

    const result: ComparisonResult = {
      new: [],
      conflicts: [],
      duplicates: [],
      updates: [],
    };

    // Helper function to check time overlap
    const hasTimeOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
      const [h1, m1] = start1.split(':').map(Number);
      const [h2, m2] = end1.split(':').map(Number);
      const [h3, m3] = start2.split(':').map(Number);
      const [h4, m4] = end2.split(':').map(Number);

      const start1Minutes = h1 * 60 + m1;
      const end1Minutes = h2 * 60 + m2;
      const start2Minutes = h3 * 60 + m3;
      const end2Minutes = h4 * 60 + m4;

      return (start1Minutes < end2Minutes && end1Minutes > start2Minutes);
    };

    // Compare each uploaded entry with existing entries
    for (const uploadedEntry of uploadedEntries) {
      let matchFound = false;

      for (const existingEntry of existingEntries) {
        // Check if same teacher, day, and time
        if (
          uploadedEntry.teacherId === existingEntry.teacherId &&
          uploadedEntry.day === existingEntry.day &&
          uploadedEntry.startTime === existingEntry.startTime &&
          uploadedEntry.endTime === existingEntry.endTime
        ) {
          matchFound = true;

          // Check if course or classroom is different
          if (
            uploadedEntry.course !== existingEntry.course ||
            uploadedEntry.classroom !== existingEntry.classroom
          ) {
            result.updates.push({
              uploaded: uploadedEntry,
              existing: existingEntry,
            });
          } else {
            // Exact duplicate
            result.duplicates.push({
              uploaded: uploadedEntry,
              existing: existingEntry,
            });
          }
          break;
        }

        // Check for time conflicts (same teacher and day, but different overlapping times)
        if (
          uploadedEntry.teacherId === existingEntry.teacherId &&
          uploadedEntry.day === existingEntry.day &&
          hasTimeOverlap(
            uploadedEntry.startTime,
            uploadedEntry.endTime,
            existingEntry.startTime,
            existingEntry.endTime
          ) &&
          (uploadedEntry.startTime !== existingEntry.startTime ||
            uploadedEntry.endTime !== existingEntry.endTime)
        ) {
          matchFound = true;
          result.conflicts.push({
            uploaded: uploadedEntry,
            existing: existingEntry,
            conflictType: 'time_overlap',
          });
          break;
        }
      }

      // If no match found, it's a new entry
      if (!matchFound) {
        result.new.push(uploadedEntry);
      }
    }

    res.json(result);
  } catch (error) {
    console.error('Compare timetable error:', error);
    res.status(500).json({ error: 'Failed to compare timetable entries' });
  }
});

// Bulk upload timetable entries with options
router.post('/bulk-upload', async (req, res) => {
  try {
    const { 
      newEntries = [], 
      updates = [], 
      skipDuplicates = true 
    } = req.body;

    const results = {
      added: 0,
      updated: 0,
      skipped: 0,
      errors: [] as string[],
    };

    // Add new entries
    for (const entry of newEntries) {
      try {
        await prisma.timetableEntry.create({
          data: {
            teacherId: entry.teacherId,
            teacherName: entry.teacherName,
            course: entry.course,
            classroom: entry.classroom || '',
            day: entry.day,
            startTime: entry.startTime,
            endTime: entry.endTime,
          },
        });
        results.added++;
      } catch (error: any) {
        results.errors.push(`Failed to add entry: ${entry.course} - ${error.message}`);
      }
    }

    // Update existing entries
    for (const update of updates) {
      try {
        await prisma.timetableEntry.update({
          where: { id: update.existingId },
          data: {
            teacherId: update.uploaded.teacherId,
            teacherName: update.uploaded.teacherName,
            course: update.uploaded.course,
            classroom: update.uploaded.classroom || '',
            day: update.uploaded.day,
            startTime: update.uploaded.startTime,
            endTime: update.uploaded.endTime,
          },
        });
        results.updated++;
      } catch (error: any) {
        results.errors.push(`Failed to update entry: ${update.uploaded.course} - ${error.message}`);
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ error: 'Failed to bulk upload timetable entries' });
  }
});

export default router;

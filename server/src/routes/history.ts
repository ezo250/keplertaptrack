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

// Clean up duplicate history entries
router.post('/cleanup-duplicates', async (req, res) => {
  try {
    console.log('[CLEANUP] Starting duplicate history cleanup...');
    
    // Find all history entries
    const allHistory = await prisma.deviceHistory.findMany({
      orderBy: { timestamp: 'asc' },
    });
    
    console.log(`[CLEANUP] Found ${allHistory.length} total history entries`);
    
    // Group by deviceId, userId, action, and similar timestamp (within 5 minutes)
    const duplicateGroups: Map<string, typeof allHistory> = new Map();
    const entriesToKeep = new Set<string>();
    const entriesToDelete = new Set<string>();
    
    for (const entry of allHistory) {
      // Create a key based on deviceId, userId, action, and timestamp rounded to 5-minute intervals
      const timestamp = new Date(entry.timestamp);
      const roundedTime = new Date(timestamp.getTime() - (timestamp.getTime() % (5 * 60 * 1000)));
      const key = `${entry.deviceId}-${entry.userId}-${entry.action}-${roundedTime.getTime()}`;
      
      if (!duplicateGroups.has(key)) {
        duplicateGroups.set(key, []);
      }
      duplicateGroups.get(key)!.push(entry);
    }
    
    // For each group, keep the first entry and mark others as duplicates
    for (const [key, group] of duplicateGroups.entries()) {
      if (group.length > 1) {
        console.log(`[CLEANUP] Found ${group.length} duplicates for key: ${key}`);
        // Keep the first entry (earliest)
        entriesToKeep.add(group[0].id);
        // Mark the rest for deletion
        for (let i = 1; i < group.length; i++) {
          entriesToDelete.add(group[i].id);
          console.log(`[CLEANUP]   - Marking duplicate for deletion: ${group[i].id} at ${group[i].timestamp}`);
        }
      } else {
        entriesToKeep.add(group[0].id);
      }
    }
    
    console.log(`[CLEANUP] Keeping ${entriesToKeep.size} entries, deleting ${entriesToDelete.size} duplicates`);
    
    // Delete duplicates
    if (entriesToDelete.size > 0) {
      const deleteResult = await prisma.deviceHistory.deleteMany({
        where: {
          id: {
            in: Array.from(entriesToDelete),
          },
        },
      });
      
      console.log(`[CLEANUP] Successfully deleted ${deleteResult.count} duplicate entries`);
      
      res.json({
        success: true,
        message: `Cleanup complete: Deleted ${deleteResult.count} duplicate entries`,
        kept: entriesToKeep.size,
        deleted: deleteResult.count,
      });
    } else {
      console.log('[CLEANUP] No duplicates found');
      res.json({
        success: true,
        message: 'No duplicates found',
        kept: entriesToKeep.size,
        deleted: 0,
      });
    }
  } catch (error) {
    console.error('[CLEANUP] Error during cleanup:', error);
    res.status(500).json({ error: 'Failed to cleanup duplicates' });
  }
});

export default router;

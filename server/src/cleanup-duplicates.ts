import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupDuplicateHistory() {
  console.log('🧹 Starting duplicate history cleanup...\n');

  try {
    // Fetch all device history entries
    const allHistory = await prisma.deviceHistory.findMany({
      orderBy: { timestamp: 'asc' },
    });

    console.log(`📊 Total history entries found: ${allHistory.length}`);

    // Group entries by deviceId, userId, and action
    const groups = new Map<string, typeof allHistory>();

    for (const entry of allHistory) {
      const key = `${entry.deviceId}-${entry.userId}-${entry.action}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(entry);
    }

    let duplicatesFound = 0;
    let duplicatesDeleted = 0;
    const idsToDelete: string[] = [];

    // Check each group for duplicates (within 30 seconds of each other)
    for (const [key, entries] of groups.entries()) {
      if (entries.length > 1) {
        // Sort by timestamp
        entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // Check for duplicates within 30 seconds
        for (let i = 1; i < entries.length; i++) {
          const prevTime = new Date(entries[i - 1].timestamp).getTime();
          const currTime = new Date(entries[i].timestamp).getTime();
          const timeDiff = currTime - prevTime;

          // If entries are within 30 seconds, consider them duplicates
          if (timeDiff < 30000) {
            duplicatesFound++;
            idsToDelete.push(entries[i].id);
            console.log(`❌ Duplicate found: ${key}`);
            console.log(`   - Keeping: ${entries[i - 1].id} (${entries[i - 1].timestamp})`);
            console.log(`   - Deleting: ${entries[i].id} (${entries[i].timestamp})`);
            console.log(`   - Time diff: ${timeDiff}ms (${(timeDiff / 1000).toFixed(1)}s)\n`);
          }
        }
      }
    }

    if (idsToDelete.length > 0) {
      console.log(`\n🗑️  Deleting ${idsToDelete.length} duplicate entries...`);
      
      const deleteResult = await prisma.deviceHistory.deleteMany({
        where: {
          id: {
            in: idsToDelete,
          },
        },
      });

      duplicatesDeleted = deleteResult.count;
      console.log(`✅ Successfully deleted ${duplicatesDeleted} duplicate entries`);
    } else {
      console.log('✅ No duplicates found!');
    }

    // Summary
    console.log('\n📈 Cleanup Summary:');
    console.log(`   - Total entries checked: ${allHistory.length}`);
    console.log(`   - Duplicates found: ${duplicatesFound}`);
    console.log(`   - Duplicates deleted: ${duplicatesDeleted}`);
    console.log(`   - Remaining entries: ${allHistory.length - duplicatesDeleted}`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupDuplicateHistory()
  .then(() => {
    console.log('\n✨ Cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  });

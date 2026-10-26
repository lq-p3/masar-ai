import dotenv from 'dotenv';
dotenv.config();

import { getFirestore } from '../config/firestore.js';
import { logger } from '../utils/logger.js';

async function migrateLegacyApplications() {
  const targetUid = process.argv[2];

  if (!targetUid || targetUid.trim().length === 0) {
    console.error('\n[ERROR] Target User UID is required for legacy migration.');
    console.error('Usage: npx tsx src/scripts/migrate-legacy-applications.ts <TARGET_USER_UID>\n');
    process.exit(1);
  }

  logger.info(`Starting legacy applications migration for target UID: ${targetUid}`);

  const db = getFirestore();
  const collectionRef = db.collection('applications');
  const snapshot = await collectionRef.get();

  let migratedCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (!data.userId) {
      logger.info(`Migrating document ID '${doc.id}' (${data.company || 'Unknown'}) -> Setting userId = ${targetUid}`);
      await doc.ref.update({
        userId: targetUid.trim(),
        updatedAt: new Date().toISOString()
      });
      migratedCount++;
    }
  }

  logger.info(`Migration complete! Successfully updated ${migratedCount} legacy application document(s).`);
  console.log(`\n✅ Legacy Migration Summary: ${migratedCount} document(s) assigned to UID: ${targetUid}\n`);
  process.exit(0);
}

migrateLegacyApplications().catch((err) => {
  logger.error('Migration script failed', err);
  process.exit(1);
});

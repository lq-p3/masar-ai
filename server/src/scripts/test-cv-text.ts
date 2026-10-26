import { getFirestore } from '../config/firestore.js';

async function testExtraction() {
  const db = getFirestore();
  const uid = 'bqNWhDJpVyU2DjhLd3SiSDv6KLl1';
  const snap = await db.collection('users').doc(uid).collection('resumes').get();
  
  for (const doc of snap.docs) {
    const d = doc.data();
    console.log(`\n========================================`);
    console.log(`RESUME: ${d.fileName} (${doc.id})`);
    console.log(`========================================`);
    console.log(d.resumeText?.slice(0, 1000) || '(EMPTY TEXT)');
  }
}

testExtraction();

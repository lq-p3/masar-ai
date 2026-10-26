import { getFirestore } from '../config/firestore.js';

async function check() {
  const db = getFirestore();
  const uid = 'bqNWhDJpVyU2DjhLd3SiSDv6KLl1';
  console.log(`Checking resumes for user ${uid}...`);
  const snap = await db.collection('users').doc(uid).collection('resumes').get();
  console.log(`Found ${snap.docs.length} resumes in Firestore:`);
  snap.docs.forEach(doc => {
    const d = doc.data();
    console.log(`\nID: ${doc.id}`);
    console.log(`FileName: ${d.fileName}`);
    console.log(`isPrimary: ${d.isPrimary}`);
    console.log(`Text Length: ${(d.resumeText || '').length}`);
    console.log(`Text Preview: ${(d.resumeText || '').slice(0, 200)}...`);
  });
}

check();

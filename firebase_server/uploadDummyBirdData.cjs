const admin = require('firebase-admin');
const svc = require('./bdapp-df984-firebase-adminsdk-fbsvc-49f8b500b8.json');
const { dummyBirdData } = require('./dummyBirdData.cjs');

admin.initializeApp({ credential: admin.credential.cert(svc) });

async function main() {
  const db = admin.firestore();
  const batch = db.batch();
  const col = db.collection('birds');

  for (const bird of dummyBirdData) {
    const ref = col.doc(); // auto id
    batch.set(ref, {
      ...bird,
      timestamp: bird.timestamp || new Date().toISOString(),
    });
  }

  await batch.commit();
  console.log(`✅ Uploaded ${dummyBirdData.length} birds`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

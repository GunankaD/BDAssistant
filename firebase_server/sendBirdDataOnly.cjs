const admin = require('firebase-admin');
const svc = require('./bdapp-df984-firebase-adminsdk-fbsvc-49f8b500b8.json'); // secure
admin.initializeApp({ credential: admin.credential.cert(svc) });

async function getLatestToken() {
  const snap = await admin.firestore()
    .collection('device_tokens')
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();
  if (snap.empty) throw new Error('No tokens found');
  return snap.docs[0].id; // your token is the doc ID in your setup
}

function capitalize(str) {
  if (str.length === 0) {
    return ""; // Handle empty strings
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// send to single device token
async function sendToToken(token, bird) {
  const message = {
    token,
    data: {
      title: 'Bird Detected & Deterred!',
      body: `${capitalize(bird.species)} •  Farm C`,
      type: 'bird_seen',
      id: bird.id,
      species: bird.species || '',
      soundName: bird.soundName || '',
      timestamp: bird.timestamp || '',
      imageUrl: bird.imageUrl || '',
      location: bird.location ? JSON.stringify(bird.location) : '',
      device: bird.device || '',
    },
    android: {
      priority: 'high',
      // no notification block here -> OS won't auto-show
    },
  };

  return admin.messaging().send(message);
}

async function main() {
  const token = await getLatestToken();
  // console.log(`Device Token: ${token}`);

  const bird = {
    id: 'dummy123',
    species: 'sparrow',
    timestamp: new Date().toISOString(),
    imageUrl: 'https://cdn.britannica.com/10/250610-050-BC5CCDAF/Zebra-finch-Taeniopygia-guttata-bird.jpg',
    location: { lat: 12.97, lng: 77.59 },
    device: 'test-plugin',
  };

  await sendToToken(token, bird);
  console.log('sent ✅');
}

main().catch(console.error);
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

async function main() {
  console.log('🚀 Creating Demo Entry in Firestore...');

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    console.error('❌ Missing credentials in .env');
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        privateKey: privateKey.replace(/\\n/g, '\n'),
        clientEmail,
      }),
    });

    const db = admin.firestore();

    // Create a document in a NEW collection called "DEMO_COLLECTION"
    const docRef = db.collection('DEMO_COLLECTION').doc('demo_doc');
    
    await docRef.set({
      message: '👋 Hello! I was created automatically.',
      explanation: 'You do NOT need to create collections manually. Firestore creates them when you write data.',
      timestamp: new Date(),
      project_used: projectId
    });

    console.log('\n✅ Success! I created a new collection named "DEMO_COLLECTION".');
    console.log('👉 Go to your Firestore Console and refresh. You should see it immediately.');
    console.log(`   Project ID: ${projectId}`);

  } catch (e) {
    console.error('❌ Error:', e);
  }
}

main();

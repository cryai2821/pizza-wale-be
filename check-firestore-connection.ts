import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

async function main() {
  console.log('🔥 Checking Firestore Connection...');

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  console.log('Environment Variables:');
  console.log(`- FIREBASE_PROJECT_ID: ${projectId ? 'SET' : 'MISSING'}`);
  console.log(`- FIREBASE_PRIVATE_KEY: ${privateKey ? 'SET' : 'MISSING'}`);
  console.log(`- FIREBASE_CLIENT_EMAIL: ${clientEmail ? 'SET' : 'MISSING'}`);
  console.log(`- FIREBASE_SERVICE_ACCOUNT_PATH: ${serviceAccountPath || 'MISSING'}`);

  let initialized = false;

  if (projectId && privateKey && clientEmail) {
    console.log('Attempting to initialize with ENV vars...');
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                privateKey: privateKey.replace(/\\n/g, '\n'),
                clientEmail,
            }),
        });
        initialized = true;
        console.log('✅ Initialized with ENV vars.');
    } catch (e) {
        console.error('❌ Failed to initialize with ENV vars:', e.message);
    }
  } else if (serviceAccountPath) {
    console.log(`Attempting to initialize with Service Account File: ${serviceAccountPath}`);
    const fullPath = path.resolve(process.cwd(), serviceAccountPath);
    if (fs.existsSync(fullPath)) {
        try {
            const serviceAccount = require(fullPath);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            initialized = true;
            console.log('✅ Initialized with Service Account File.');
        } catch (e) {
            console.error('❌ Failed to initialize with JSON file:', e.message);
        }
    } else {
        console.error(`❌ File not found at: ${fullPath}`);
    }
  } else {
      console.error('❌ No valid credentials found in environment.');
  }

  if (initialized) {
      try {
          const db = admin.firestore();
          const testRef = db.collection('test_connection').doc('ping');
          await testRef.set({ timestamp: new Date(), message: 'Hello from Backend' });
          console.log('✅ Successfully wrote to Firestore (collection: test_connection)');
      } catch (e) {
          console.error('❌ Firestore Write Failed:', e.message);
      }
  }
}

main().catch(console.error);

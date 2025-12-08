import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('🔍 Checking for orders sub-collection...');

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    console.error('❌ Missing credentials');
    return;
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      privateKey: privateKey.replace(/\\n/g, '\n'),
      clientEmail,
    }),
  });

  const db = admin.firestore();
  const shopId = '630f4828-f130-4e8d-9038-c9e3361d43fc';

  console.log(`\n📊 Checking shop: ${shopId}`);
  
  // Check if shop document exists
  const shopDoc = await db.collection('shops').doc(shopId).get();
  console.log(`   Shop document exists: ${shopDoc.exists}`);
  
  if (shopDoc.exists) {
    console.log(`   Shop data:`, shopDoc.data());
  }

  // Check orders sub-collection
  const ordersSnapshot = await db.collection('shops').doc(shopId).collection('orders').get();
  console.log(`\n📦 Orders found: ${ordersSnapshot.size}`);
  
  if (ordersSnapshot.size > 0) {
    console.log('\n   Order IDs:');
    ordersSnapshot.docs.forEach(doc => {
      console.log(`   - ${doc.id}`);
      console.log(`     Data:`, doc.data());
    });
  } else {
    console.log('   ⚠️ No orders in sub-collection');
    
    // Let's check if updateOrder was ever called
    console.log('\n🔍 This means either:');
    console.log('   1. No order was created via the API');
    console.log('   2. FirestoreService.updateOrder() is not being called');
    console.log('   3. There was an error during the Firestore write');
  }
}

main().catch(console.error);

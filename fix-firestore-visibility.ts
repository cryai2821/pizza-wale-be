import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Fixing Firestore Visibility...');

  // 1. Initialize Firebase
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

  // 2. Get Shop Details
  const shop = await prisma.shop.findUnique({ where: { username: 'admin' } });
  if (!shop) throw new Error('Shop not found in Postgres');

  console.log(`   Target Shop ID: ${shop.id}`);

  // 3. Create Parent Document in Firestore
  // This makes the 'shops' collection and the specific shop document "real" and visible
  const shopRef = db.collection('shops').doc(shop.id);
  
  await shopRef.set({
    name: shop.name,
    username: shop.username,
    isOpen: shop.isOpen,
    updatedAt: new Date(),
    _info: "Created to ensure visibility in Console"
  }, { merge: true });

  console.log('✅ Created parent Shop document in Firestore.');
  console.log('   Collection: shops');
  console.log(`   Document:   ${shop.id}`);

  // 4. Check for Orders
  const ordersSnapshot = await shopRef.collection('orders').get();
  console.log(`\n📊 Found ${ordersSnapshot.size} orders in this shop's sub-collection.`);
  
  if (ordersSnapshot.size > 0) {
      console.log('   Latest Order IDs:');
      ordersSnapshot.docs.slice(0, 3).forEach(doc => console.log(`   - ${doc.id}`));
  } else {
      console.log('   ⚠️ No orders found. Did the previous script fail silently?');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

async function main() {
  console.log('🛒 Creating a LIVE Order to verify Firestore...');

  // 1. Get Shop ID
  const shop = await prisma.shop.findUnique({ where: { username: 'admin' } });
  if (!shop) throw new Error('Shop not found');
  console.log(`   Shop ID: ${shop.id}`);

  // 2. Get a Product (Margherita)
  const product = await prisma.product.findFirst({
    where: { name: 'Margherita', shopId: shop.id },
    include: { optionConfigs: { include: { optionGroup: { include: { options: true } } } } }
  });
  if (!product) throw new Error('Product not found');

  // 3. Login as User (to get token)
  console.log('   🔑 Authenticating...');
  await axios.post(`${BASE_URL}/auth/otp/send`, { phone: '+919999999999' });
  const authRes = await axios.post(`${BASE_URL}/auth/otp/verify`, { phone: '+919999999999', otp: '123456' });
  const token = authRes.data.access_token;

  // 4. Create Order
  console.log('   📦 Sending Order Request...');
  
  // Prepare options if needed (Margherita might have Size)
  const sizeGroup = product.optionConfigs.find(c => c.optionGroup.name === 'Size')?.optionGroup;
  const regularOpt = sizeGroup?.options.find(o => o.name.includes('Regular'));
  
  const options: any[] = [];
  if (regularOpt) options.push({ optionId: regularOpt.id });

  try {
    // @ts-ignore
    const res = await axios.post(`${BASE_URL}/orders`, {
      shopId: shop.id,
      items: [{
        productId: product.id,
        quantity: 1,
        options: options as any
      }]
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // @ts-ignore
    const order = res.data;
    console.log('\n✅ Order Created Successfully!');
    console.log(`   Order ID (DB): ${order.id}`);
    console.log(`   Short ID: ${order.shortId}`);
    console.log(`   Total Amount: ${order.totalAmount}`);
    
    console.log('\n🔎 WHERE TO FIND IT IN FIRESTORE:');
    console.log(`   Collection: shops`);
    console.log(`   Document:   ${shop.id}`);
    console.log(`   Sub-Coll:   orders`);
    console.log(`   Document:   ${order.id}`);

  } catch (e) {
    console.error('❌ Failed to create order:', e.response?.data || e.message);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

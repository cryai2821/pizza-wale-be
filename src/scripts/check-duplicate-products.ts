
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    include: {
      _count: {
        select: { orderItems: true }
      },
      category: true
    }
  });

  // Group by shopId + normalized name
  const grouped = products.reduce((acc, p) => {
    const key = `${p.shopId}_${p.name.toLowerCase().trim()}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {} as Record<string, typeof products>);

  console.log('--- Duplicate Products Analysis ---');
  let hasDuplicates = false;

  for (const [key, prods] of Object.entries(grouped)) {
    if (prods.length > 1) {
      hasDuplicates = true;
      const name = prods[0].name;
      console.log(`\nProduct: "${name}" (Shop: ${prods[0].shopId}) has ${prods.length} entries:`);
      prods.forEach(p => {
        console.log(`  - ID: ${p.id}, Category: ${p.category.name}, Orders: ${p._count.orderItems}, Price: ${p.basePrice}`);
      });
    }
  }

  if (!hasDuplicates) {
    console.log('\nNo duplicate products found.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

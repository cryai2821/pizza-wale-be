
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

  // Group by shopId + categoryId + normalized name
  const grouped = products.reduce((acc, p) => {
    // Strict grouping: Same Shop, Same Category, Same Name
    const key = `${p.shopId}_${p.categoryId}_${p.name.toLowerCase().trim()}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {} as Record<string, typeof products>);

  console.log('--- Fixing Duplicate Products (Same Category Only) ---');

  for (const [key, prods] of Object.entries(grouped)) {
    if (prods.length > 1) {
      console.log(`\nProcessing duplicate group: "${prods[0].name}" in Category "${prods[0].category.name}" (${prods.length} entries)`);
      
      // 1. Pick survivor (prioritize ones with orders, then latest created? or just first)
      // Sort by order count desc to keep usage history
      prods.sort((a, b) => b._count.orderItems - a._count.orderItems);

      const survivor = prods[0];
      const toDelete = prods.slice(1);

      console.log(`  Survivor: ${survivor.id} (Orders: ${survivor._count.orderItems}, Price: ${survivor.basePrice})`);

      for (const duplicate of toDelete) {
        console.log(`  Deleting duplicate: ${duplicate.id} (Orders: ${duplicate._count.orderItems})`);
        
        // 2. Move OrderItems to survivor
        const updateOrders = await prisma.orderItem.updateMany({
            where: { productId: duplicate.id },
            data: { productId: survivor.id }
        });
        if (updateOrders.count > 0) console.log(`    -> Moved ${updateOrders.count} order items to survivor.`);

        // 3. Delete related ProductOptionConfigs (cascade delete might handle this if set, but let's be safe/explicit if needed)
        // Actually, schema doesn't specify cascade on many relations, so we manually clean up.
        await prisma.productOptionConfig.deleteMany({
            where: { productId: duplicate.id }
        });
        
        // 4. Delete the duplicate product
        await prisma.product.delete({
            where: { id: duplicate.id }
        });
        console.log(`    -> Product deleted.`);
      }
    }
  }

  console.log('\nCleanup complete.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

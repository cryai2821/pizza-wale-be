
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    }
  });

  const grouped = categories.reduce((acc, cat) => {
    const key = cat.name.toLowerCase().trim();
    if (!acc[key]) acc[key] = [];
    acc[key].push(cat);
    return acc;
  }, {} as Record<string, typeof categories>);

  console.log('--- Fixing Duplicate Categories ---');

  for (const [name, cats] of Object.entries(grouped)) {
    if (cats.length > 1) {
      console.log(`\nProcessing duplicate group: "${name}" (${cats.length} entries)`);
      
      // 1. Pick survivor (the one with most products, or first one)
      cats.sort((a, b) => b._count.products - a._count.products);
      const survivor = cats[0];
      const toDelete = cats.slice(1);

      console.log(`  Survivor: ${survivor.id} (Products: ${survivor._count.products})`);

      for (const duplicate of toDelete) {
        console.log(`  Deleting duplicate: ${duplicate.id} (Products: ${duplicate._count.products})`);
        
        // 2. Move products to survivor
        const updateResult = await prisma.product.updateMany({
            where: { categoryId: duplicate.id },
            data: { categoryId: survivor.id }
        });
        console.log(`    -> Moved ${updateResult.count} products to survivor.`);

        // 3. Move OptionGroups (if any) to survivor
        const updateOptionsResult = await prisma.optionGroup.updateMany({
            where: { categoryId: duplicate.id },
            data: { categoryId: survivor.id }
        });
        console.log(`    -> Moved ${updateOptionsResult.count} option groups to survivor.`);

        // 4. Delete the duplicate category
        await prisma.category.delete({
            where: { id: duplicate.id }
        });
        console.log(`    -> Category deleted.`);
      }
    }
  }

  console.log('\nCleanup complete.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

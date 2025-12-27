
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

  console.log('--- Duplicate Categories Analysis ---');
  let hasDuplicates = false;

  for (const [name, cats] of Object.entries(grouped)) {
    if (cats.length > 1) {
      hasDuplicates = true;
      console.log(`\nName: "${name}" has ${cats.length} entries:`);
      cats.forEach(c => {
        console.log(`  - ID: ${c.id}, Products: ${c._count.products}`);
      });
    }
  }

  if (!hasDuplicates) {
    console.log('\nNo duplicate categories found.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());

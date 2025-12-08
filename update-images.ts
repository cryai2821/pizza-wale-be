import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=2070&auto=format&fit=crop';

async function main() {
  console.log('Updating products with default image...');
  
  const result = await prisma.product.updateMany({
    where: {
      imageUrl: null
    },
    data: {
      imageUrl: DEFAULT_IMAGE
    }
  });

  console.log(`Updated ${result.count} products with default image.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

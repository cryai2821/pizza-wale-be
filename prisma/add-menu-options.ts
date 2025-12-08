import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Adding Options to Momos and Burgers...');

  const shop = await prisma.shop.findUnique({ where: { username: 'admin' } });
  if (!shop) throw new Error('Shop not found');

  // --- 1. Momo Preparation ---
  console.log('\n🥟 Configuring Momos...');
  const momoCats = await prisma.category.findMany({
    where: {
      name: { in: ['Momos (6 Pcs)', 'Momo Burgers'] },
      shopId: shop.id,
    },
  });

  if (momoCats.length > 0) {
    // Create Preparation Group
    const prepGroup = await prisma.optionGroup.create({
      data: {
        name: 'Preparation',
        minSelect: 1,
        maxSelect: 1,
        categoryId: momoCats[0].id, // Attach to first found
        options: {
          create: [
            { name: 'Steam', price: 0 },
            { name: 'Fry', price: 10 },
            { name: 'Deep Fry', price: 20 },
            { name: 'Gravy', price: 40 },
          ],
        },
      },
    });

    // Attach to all products in these categories
    for (const cat of momoCats) {
      const products = await prisma.product.findMany({ where: { categoryId: cat.id } });
      for (const p of products) {
        // Check if already has options
        const existing = await prisma.productOptionConfig.findUnique({
            where: {
                productId_optionGroupId: {
                    productId: p.id,
                    optionGroupId: prepGroup.id
                }
            }
        });
        
        if (!existing) {
            await prisma.productOptionConfig.create({
            data: {
                productId: p.id,
                optionGroupId: prepGroup.id,
                isEnabled: true,
            },
            });
            console.log(`   + Added Preparation to ${p.name}`);
        }
      }
    }
  }

  // --- 2. Burger Add-ons ---
  console.log('\n🍔 Configuring Burgers...');
  const burgerCat = await prisma.category.findFirst({
    where: { name: 'Aloo Tikki Burgers', shopId: shop.id },
  });

  if (burgerCat) {
    const addonGroup = await prisma.optionGroup.create({
      data: {
        name: 'Add-ons',
        minSelect: 0,
        maxSelect: 2,
        categoryId: burgerCat.id,
        options: {
          create: [
            { name: 'Extra Cheese Slice', price: 20 },
            { name: 'Double Patty', price: 40 }, // Price assumed based on menu logic
          ],
        },
      },
    });

    const products = await prisma.product.findMany({ where: { categoryId: burgerCat.id } });
    for (const p of products) {
        const existing = await prisma.productOptionConfig.findUnique({
            where: {
                productId_optionGroupId: {
                    productId: p.id,
                    optionGroupId: addonGroup.id
                }
            }
        });

        if (!existing) {
            await prisma.productOptionConfig.create({
                data: {
                productId: p.id,
                optionGroupId: addonGroup.id,
                isEnabled: true,
                },
            });
            console.log(`   + Added Add-ons to ${p.name}`);
        }
    }
  }

  console.log('✅ Options Added Successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

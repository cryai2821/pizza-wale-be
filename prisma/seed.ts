import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const shopId = '630f4828-f130-4e8d-9038-c9e3361d43fc';
  const productId = '098014d8-b9de-41c1-bb5b-fae35265cc1';

  // 1. Create Shop
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const shop = await prisma.shop.upsert({
    where: { id: shopId },
    update: {},
    create: {
      id: shopId,
      name: 'Pizza Wale',
      username: 'admin',
      password: hashedPassword,
      isOpen: true,
    },
  });

  // 2. Create Category
  const pizzaCategory = await prisma.category.create({
    data: {
      name: 'Pizzas',
      shopId: shop.id,
      sortOrder: 1,
    },
  });

  // 3. Create Option Groups
  const sizeGroup = await prisma.optionGroup.create({
    data: {
      name: 'Size',
      categoryId: pizzaCategory.id,
      minSelect: 1,
      maxSelect: 1,
      options: {
        create: [
          { name: 'Small', price: 0 },
          { name: 'Medium', price: 100 },
          { name: 'Large', price: 200 },
        ],
      },
    },
    include: { options: true },
  });

  // 4. Create Product
  const margherita = await prisma.product.upsert({
    where: { id: productId },
    update: {},
    create: {
      id: productId,
      name: 'Margherita',
      description: 'Classic cheese and tomato',
      basePrice: 299,
      categoryId: pizzaCategory.id,
      shopId: shop.id,
      isAvailable: true,
      optionConfigs: {
        create: [
          {
            optionGroupId: sizeGroup.id,
            isEnabled: true,
          },
        ],
      },
    },
  });

  // 5. Create User
  const user = await prisma.user.upsert({
    where: { phone: '+1234567890' },
    update: {},
    create: {
      phone: '+1234567890',
      name: 'Test Customer',
    },
  });

  console.log({ shop, margherita, user });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

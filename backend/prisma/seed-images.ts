import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateImagesWithPlaceholders() {
  console.log('🖼️ Updating images with placeholder URLs...');

  // Update category images with placeholder images
  const categories = [
    { slug: 'sarees', name: 'Sarees' },
    { slug: 'lehengas', name: 'Lehengas' },
    { slug: 'kurtas-kurtis', name: 'Kurtas & Kurtis' },
    { slug: 'anarkalis', name: 'Anarkalis' },
    { slug: 'indo-western', name: 'Indo-Western' },
    { slug: 'accessories', name: 'Accessories' }
  ];

  for (const cat of categories) {
    await prisma.category.updateMany({
      where: { slug: cat.slug },
      data: {
        image: `https://placehold.co/400x300/f3f4f6/374151/png?text=${encodeURIComponent(cat.name)}`
      }
    });
    console.log(`✅ Updated ${cat.name} category image`);
  }

  // Update product images with placeholder images
  const products = await prisma.product.findMany({
    include: { images: true }
  });

  let imageUpdateCount = 0;

  for (const product of products) {
    // Update each product's images
    for (let i = 0; i < product.images.length; i++) {
      const image = product.images[i];
      const randomId = Math.floor(Math.random() * 1000) + 400; // Random ID for variety
      
      await prisma.productImage.update({
        where: { id: image.id },
        data: {
          url: `https://placehold.co/400x600/e5e7eb/6b7280/png?text=Product+Image+${i + 1}`
        }
      });
      
      imageUpdateCount++;
    }
    console.log(`✅ Updated images for: ${product.name}`);
  }

  console.log(`✅ Updated ${imageUpdateCount} product images`);
  console.log('🎉 Image updates completed successfully!');
}

updateImagesWithPlaceholders()
  .catch((e) => {
    console.error('❌ Error updating images:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
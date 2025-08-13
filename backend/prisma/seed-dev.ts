import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Environment protection - prevent running in production
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  Development seeding skipped in production environment');
    return;
  }

  console.log('🌱 Starting development database seed...');

  // Create main categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'sarees' },
      update: {},
      create: {
        name: 'Sarees',
        slug: 'sarees',
        description: 'Traditional Indian draping garment with timeless elegance',
        image: '/images/categories/sarees.jpg'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'lehengas' },
      update: {},
      create: {
        name: 'Lehengas',
        slug: 'lehengas',
        description: 'Traditional three-piece outfit for weddings and festivals',
        image: '/images/categories/lehengas.jpg'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'kurtas-kurtis' },
      update: {},
      create: {
        name: 'Kurtas & Kurtis',
        slug: 'kurtas-kurtis',
        description: 'Comfortable everyday ethnic wear with modern styling',
        image: '/images/categories/kurtas.jpg'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'anarkalis' },
      update: {},
      create: {
        name: 'Anarkalis',
        slug: 'anarkalis',
        description: 'Flowy, floor-length kurtas with a regal feel',
        image: '/images/categories/anarkalis.jpg'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'indo-western' },
      update: {},
      create: {
        name: 'Indo-Western',
        slug: 'indo-western',
        description: 'Contemporary fusion wear blending Indian and Western styles',
        image: '/images/categories/indo-western.jpg'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'accessories' },
      update: {},
      create: {
        name: 'Accessories',
        slug: 'accessories',
        description: 'Complete your ethnic look with traditional accessories',
        image: '/images/categories/accessories.jpg'
      }
    })
  ]);

  console.log('✅ Created main categories');

  // Create subcategories
  await Promise.all([
    // Saree subcategories
    prisma.category.upsert({
      where: { slug: 'silk-sarees' },
      update: {},
      create: {
        name: 'Silk Sarees',
        slug: 'silk-sarees',
        description: 'Luxurious silk sarees for special occasions',
        parentId: categories[0].id
      }
    }),
    prisma.category.upsert({
      where: { slug: 'cotton-sarees' },
      update: {},
      create: {
        name: 'Cotton Sarees',
        slug: 'cotton-sarees',
        description: 'Comfortable everyday cotton sarees',
        parentId: categories[0].id
      }
    }),
    // Lehenga subcategories
    prisma.category.upsert({
      where: { slug: 'bridal-lehengas' },
      update: {},
      create: {
        name: 'Bridal Lehengas',
        slug: 'bridal-lehengas',
        description: 'Exquisite bridal lehengas for your special day',
        parentId: categories[1].id
      }
    }),
    prisma.category.upsert({
      where: { slug: 'party-lehengas' },
      update: {},
      create: {
        name: 'Party Lehengas',
        slug: 'party-lehengas',
        description: 'Stylish lehengas for parties and celebrations',
        parentId: categories[1].id
      }
    })
  ]);

  console.log('✅ Created subcategories');

  // Sample products
  const products = [
    {
      name: 'Elegant Red Silk Saree with Zari Work',
      slug: 'elegant-red-silk-saree-zari-work',
      description: 'A stunning red silk saree featuring intricate zari embroidery work. Perfect for weddings, festivals, and special occasions. The saree comes with a matching blouse piece and is crafted from premium quality silk.',
      shortDescription: 'Premium red silk saree with golden zari work',
      price: 15999,
      comparePrice: 19999,
      stock: 10,
      categoryId: categories[0].id,
      fabric: 'Pure Silk',
      occasion: 'Wedding, Festival',
      designer: 'Kanjivaram Heritage',
      craftType: 'Zari Work',
      region: 'Tamil Nadu',
      careInstructions: 'Dry clean only',
      isActive: true,
      isFeatured: true,
      metaTitle: 'Red Silk Saree with Zari Work | Vibes in Threads',
      metaDescription: 'Shop elegant red silk saree with intricate zari work. Perfect for weddings and festivals. Free shipping across India.'
    },
    {
      name: 'Royal Blue Lehenga with Heavy Embroidery',
      slug: 'royal-blue-lehenga-heavy-embroidery',
      description: 'Magnificent royal blue lehenga set with heavy gold embroidery work. The set includes a beautifully embroidered lehenga, fitted choli, and matching dupatta. Perfect for bridal occasions and grand celebrations.',
      shortDescription: 'Bridal blue lehenga with gold embroidery',
      price: 45999,
      comparePrice: 55999,
      stock: 5,
      categoryId: categories[1].id,
      fabric: 'Velvet with Net',
      occasion: 'Bridal, Wedding',
      designer: 'Royal Threads',
      craftType: 'Thread Embroidery, Sequins',
      region: 'Rajasthan',
      careInstructions: 'Professional dry clean recommended',
      isActive: true,
      isFeatured: true,
      metaTitle: 'Royal Blue Bridal Lehenga | Heavy Embroidery | Vibes in Threads',
      metaDescription: 'Stunning royal blue bridal lehenga with heavy gold embroidery. Perfect for weddings. Premium quality guaranteed.'
    },
    {
      name: 'Pink Cotton Kurta with Chikankari Work',
      slug: 'pink-cotton-kurta-chikankari-work',
      description: 'Beautiful pink cotton kurta featuring traditional Chikankari embroidery from Lucknow. Comfortable and elegant, perfect for daily wear, office, or casual occasions. Comes with matching palazzo pants.',
      shortDescription: 'Pink cotton kurta with Chikankari embroidery',
      price: 2999,
      comparePrice: 3999,
      stock: 25,
      categoryId: categories[2].id,
      fabric: 'Cotton',
      occasion: 'Casual, Office, Daily Wear',
      designer: 'Lucknow Craft',
      craftType: 'Chikankari',
      region: 'Uttar Pradesh',
      careInstructions: 'Machine wash gentle or hand wash',
      isActive: true,
      isFeatured: false,
      metaTitle: 'Pink Chikankari Cotton Kurta | Vibes in Threads',
      metaDescription: 'Elegant pink cotton kurta with traditional Chikankari embroidery. Comfortable daily wear with free shipping.'
    },
    {
      name: 'Green Anarkali Suit with Mirror Work',
      slug: 'green-anarkali-suit-mirror-work',
      description: 'Gorgeous green Anarkali suit featuring traditional mirror work and embroidery. The flowing silhouette and intricate details make it perfect for festivals, parties, and special occasions. Set includes kurta, churidar, and dupatta.',
      shortDescription: 'Green Anarkali with traditional mirror work',
      price: 8999,
      comparePrice: 11999,
      stock: 15,
      categoryId: categories[3].id,
      fabric: 'Georgette',
      occasion: 'Festival, Party, Wedding',
      designer: 'Ethnic Elegance',
      craftType: 'Mirror Work, Embroidery',
      region: 'Gujarat',
      careInstructions: 'Dry clean only',
      isActive: true,
      isFeatured: true,
      metaTitle: 'Green Anarkali Suit with Mirror Work | Vibes in Threads',
      metaDescription: 'Beautiful green Anarkali suit with traditional mirror work. Perfect for festivals and parties. Shop now!'
    },
    {
      name: 'Black Indo-Western Gown with Gold Accents',
      slug: 'black-indo-western-gown-gold-accents',
      description: 'Sophisticated black Indo-Western gown with gold accent details. This contemporary piece combines traditional Indian aesthetics with modern western silhouettes. Perfect for cocktail parties and evening events.',
      shortDescription: 'Modern black Indo-Western gown with gold accents',
      price: 12999,
      comparePrice: 15999,
      stock: 8,
      categoryId: categories[4].id,
      fabric: 'Crepe with Brocade',
      occasion: 'Cocktail, Party, Evening',
      designer: 'Modern Muse',
      craftType: 'Contemporary Cut, Gold Detailing',
      region: 'Delhi',
      careInstructions: 'Dry clean recommended',
      isActive: true,
      isFeatured: true,
      metaTitle: 'Black Indo-Western Gown | Gold Accents | Vibes in Threads',
      metaDescription: 'Elegant black Indo-Western gown with gold accents. Perfect for cocktail parties and evening events.'
    }
  ];

  console.log('Creating sample products...');
  for (const productData of products) {
    const product = await prisma.product.upsert({
      where: { slug: productData.slug },
      update: {},
      create: productData
    });

    // Add sample images for each product (skip if images already exist)
    const existingImages = await prisma.productImage.findMany({
      where: { productId: product.id }
    });
    
    if (existingImages.length === 0) {
      await prisma.productImage.createMany({
        data: [
          {
            productId: product.id,
            url: `/images/products/${product.slug}/main.jpg`,
            altText: `${product.name} - Main Image`,
            isMain: true,
            sortOrder: 1
          },
          {
            productId: product.id,
            url: `/images/products/${product.slug}/detail1.jpg`,
            altText: `${product.name} - Detail View`,
            isMain: false,
            sortOrder: 2
          },
          {
            productId: product.id,
            url: `/images/products/${product.slug}/detail2.jpg`,
            altText: `${product.name} - Close Up`,
            isMain: false,
            sortOrder: 3
          }
        ]
      });
    }

    // Add sample variants (skip if variants already exist)
    if (product.name.includes('Kurta') || product.name.includes('Anarkali') || product.name.includes('Gown')) {
      const existingVariants = await prisma.productVariant.findMany({
        where: { productId: product.id }
      });
      
      if (existingVariants.length === 0) {
        await prisma.productVariant.createMany({
          data: [
            {
              productId: product.id,
              name: 'Size',
              value: 'S',
              type: 'size',
              stock: 5
            },
            {
              productId: product.id,
              name: 'Size',
              value: 'M',
              type: 'size',
              stock: 8
            },
            {
              productId: product.id,
              name: 'Size',
              value: 'L',
              type: 'size',
              stock: 7
            },
            {
              productId: product.id,
              name: 'Size',
              value: 'XL',
              type: 'size',
              stock: 5
            }
          ]
        });
      }
    }

    // Add sample attributes (skip if attributes already exist)
    const existingAttributes = await prisma.productAttribute.findMany({
      where: { productId: product.id }
    });
    
    if (existingAttributes.length === 0) {
      await prisma.productAttribute.createMany({
        data: [
          {
            productId: product.id,
            name: 'Blouse Piece Included',
            value: product.name.includes('Saree') ? 'Yes' : 'No'
          },
          {
            productId: product.id,
            name: 'Dupatta Included',
            value: product.name.includes('Lehenga') || product.name.includes('Anarkali') ? 'Yes' : 'No'
          },
          {
            productId: product.id,
            name: 'Wash Care',
            value: product.fabric?.includes('Cotton') ? 'Machine Wash' : 'Dry Clean Only'
          }
        ]
      });
    }

    console.log(`✅ Created product: ${product.name}`);
  }

  console.log('✅ Development database seeded successfully!');
  console.log(`📊 Created ${categories.length} categories and ${products.length} products`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding development database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
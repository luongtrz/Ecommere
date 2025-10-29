import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.stockMovement.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  console.log('✅ Cleared existing data');

  // Create Users
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const userPassword = await bcrypt.hash('User@123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@shop.local',
      passwordHash: adminPassword,
      role: 'ADMIN',
      name: 'Admin Shop',
      phone: '0901234567',
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'user@shop.local',
      passwordHash: userPassword,
      role: 'CUSTOMER',
      name: 'Nguyễn Văn A',
      phone: '0912345678',
    },
  });

  console.log('✅ Created users:', { admin: admin.email, customer: customer.email });

  // Create Customer Address
  await prisma.address.create({
    data: {
      userId: customer.id,
      fullName: 'Nguyễn Văn A',
      phone: '0912345678',
      province: 'Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé',
      line1: '123 Đường Lê Lợi',
      isDefault: true,
    },
  });

  // Create Categories
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Xịt Phòng',
        slug: 'xit-phong',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Khử Mùi',
        slug: 'khu-mui',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Túi Thơm',
        slug: 'tui-thom',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Tinh Dầu Xịt',
        slug: 'tinh-dau-xit',
      },
    }),
  ]);

  console.log('✅ Created categories:', categories.length);

  // Create Products with Variants
  const productsData = [
    {
      name: 'Xịt Phòng Lavender Premium',
      slug: 'xit-phong-lavender-premium',
      description: 'Xịt phòng hương Lavender cao cấp từ Thái Lan, mang lại cảm giác thư giãn, dễ chịu cho không gian sống. Hương thơm nhẹ nhàng, lưu lâu.',
      brand: 'Thai Aroma',
      categoryId: categories[0].id,
      images: ['https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=500'],
      basePrice: 120000,
      scents: [
        { scent: 'Lavender', volumes: [100, 250, 500] },
      ],
    },
    {
      name: 'Xịt Phòng Lemongrass Fresh',
      slug: 'xit-phong-lemongrass-fresh',
      description: 'Xịt phòng hương sả chanh tươi mát, khử mùi hiệu quả, đuổi muỗi tự nhiên. Sản phẩm an toàn cho trẻ em và phụ nữ mang thai.',
      brand: 'Thai Aroma',
      categoryId: categories[0].id,
      images: ['https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500'],
      basePrice: 110000,
      scents: [
        { scent: 'Lemongrass', volumes: [100, 250, 500] },
      ],
    },
    {
      name: 'Xịt Phòng Jasmine Luxury',
      slug: 'xit-phong-jasmine-luxury',
      description: 'Hương hoa nhài quyến rũ, sang trọng. Phù hợp cho phòng khách, phòng ngủ. Chai xịt thiết kế đẹp mắt, có thể làm quà tặng.',
      brand: 'Bangkok Scents',
      categoryId: categories[0].id,
      images: ['https://images.unsplash.com/photo-1588870022626-eb99c6a63418?w=500'],
      basePrice: 135000,
      scents: [
        { scent: 'Jasmine', volumes: [250, 500] },
      ],
    },
    {
      name: 'Xịt Phòng Ocean Breeze',
      slug: 'xit-phong-ocean-breeze',
      description: 'Hương biển mát lành, tạo cảm giác sảng khoái như đang ở bãi biển. Khử mùi mạnh mẽ, thích hợp cho nhà vệ sinh, khu vực công cộng.',
      brand: 'Sea Fresh',
      categoryId: categories[0].id,
      images: ['https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500'],
      basePrice: 100000,
      scents: [
        { scent: 'Ocean', volumes: [100, 250, 500] },
      ],
    },
    {
      name: 'Xịt Phòng Citrus Sunshine',
      slug: 'xit-phong-citrus-sunshine',
      description: 'Hương cam chanh tươi mát, giúp tỉnh táo tinh thần, tăng cường năng lượng. Lý tưởng cho văn phòng làm việc.',
      brand: 'Thai Aroma',
      categoryId: categories[0].id,
      images: ['https://images.unsplash.com/photo-1572635148818-ef6fd45eb394?w=500'],
      basePrice: 105000,
      scents: [
        { scent: 'Citrus', volumes: [100, 250] },
      ],
    },
    {
      name: 'Xịt Khử Mùi Ô Tô Lavender',
      slug: 'xit-khu-mui-o-to-lavender',
      description: 'Chuyên dụng cho xe hơi, khử mùi nhanh chóng, mang lại hương thơm dễ chịu trong xe. Không gây cảm giác nặng mùi.',
      brand: 'Car Fresh',
      categoryId: categories[1].id,
      images: ['https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=500'],
      basePrice: 85000,
      scents: [
        { scent: 'Lavender', volumes: [100] },
        { scent: 'Ocean', volumes: [100] },
      ],
    },
    {
      name: 'Xịt Khử Mùi Giày Dép',
      slug: 'xit-khu-mui-giay-dep',
      description: 'Khử mùi hôi giày dép hiệu quả, diệt khuẩn, ngăn ngừa nấm móng. Hương bạc hà mát lạnh.',
      brand: 'Fresh Step',
      categoryId: categories[1].id,
      images: ['https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=500'],
      basePrice: 75000,
      scents: [
        { scent: 'Mint', volumes: [100] },
      ],
    },
    {
      name: 'Túi Thơm Hoa Lavender',
      slug: 'tui-thom-hoa-lavender',
      description: 'Túi thơm treo tủ quần áo, ngăn kéo. Hương lavender giúp thư giãn, đuổi côn trùng. Bền mùi lên đến 3 tháng.',
      brand: 'Aromatic Bag',
      categoryId: categories[2].id,
      images: ['https://images.unsplash.com/photo-1590736969955-71cc94901144?w=500'],
      basePrice: 35000,
      scents: [
        { scent: 'Lavender', volumes: [20] },
      ],
    },
    {
      name: 'Túi Thơm Hoa Hồng',
      slug: 'tui-thom-hoa-hong',
      description: 'Túi thơm hương hoa hồng ngọt ngào, lãng mạn. Thiết kế xinh xắn, có thể làm quà tặng.',
      brand: 'Aromatic Bag',
      categoryId: categories[2].id,
      images: ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500'],
      basePrice: 40000,
      scents: [
        { scent: 'Rose', volumes: [20] },
      ],
    },
    {
      name: 'Tinh Dầu Xịt Bạc Hà',
      slug: 'tinh-dau-xit-bac-ha',
      description: 'Tinh dầu bạc hà thiên nhiên, giúp tỉnh táo, giảm stress. Có thể xịt lên gối, chăn để dễ ngủ.',
      brand: 'Pure Essential',
      categoryId: categories[3].id,
      images: ['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500'],
      basePrice: 150000,
      scents: [
        { scent: 'Peppermint', volumes: [50, 100] },
      ],
    },
    {
      name: 'Tinh Dầu Xịt Hoa Nhài',
      slug: 'tinh-dau-xit-hoa-nhai',
      description: 'Tinh dầu hoa nhài cao cấp, hương thơm quyến rũ, giúp thư giãn và cải thiện giấc ngủ.',
      brand: 'Pure Essential',
      categoryId: categories[3].id,
      images: ['https://images.unsplash.com/photo-1591360236429-c22d2f7f8e2e?w=500'],
      basePrice: 180000,
      scents: [
        { scent: 'Jasmine', volumes: [50, 100] },
      ],
    },
    {
      name: 'Xịt Phòng Ylang Ylang Romance',
      slug: 'xit-phong-ylang-ylang-romance',
      description: 'Hương ngọc lan tây lãng mạn, gợi cảm. Thích hợp cho phòng ngủ, tạo không gian ấm cúng.',
      brand: 'Bangkok Scents',
      categoryId: categories[0].id,
      images: ['https://images.unsplash.com/photo-1563291074-2bf8677ac0e5?w=500'],
      basePrice: 125000,
      scents: [
        { scent: 'Ylang Ylang', volumes: [250, 500] },
      ],
    },
    {
      name: 'Xịt Phòng Sakura Dream',
      slug: 'xit-phong-sakura-dream',
      description: 'Hương hoa anh đào nhẹ nhàng, thanh tao. Mang phong cách Nhật Bản vào không gian sống.',
      brand: 'Asian Bloom',
      categoryId: categories[0].id,
      images: ['https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=500'],
      basePrice: 140000,
      scents: [
        { scent: 'Sakura', volumes: [250, 500] },
      ],
    },
    {
      name: 'Xịt Phòng Bamboo Forest',
      slug: 'xit-phong-bamboo-forest',
      description: 'Hương tre tươi mát, mang lại cảm giác gần gũi với thiên nhiên. Giúp thanh lọc không khí.',
      brand: 'Green Nature',
      categoryId: categories[0].id,
      images: ['https://images.unsplash.com/photo-1516750484197-d318c814c42a?w=500'],
      basePrice: 115000,
      scents: [
        { scent: 'Bamboo', volumes: [100, 250, 500] },
      ],
    },
    {
      name: 'Xịt Khử Mùi Nhà Bếp',
      slug: 'xit-khu-mui-nha-bep',
      description: 'Chuyên khử mùi tanh, mùi dầu mỡ trong bếp. Hương chanh tươi mát, không độc hại.',
      brand: 'Kitchen Fresh',
      categoryId: categories[1].id,
      images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500'],
      basePrice: 90000,
      scents: [
        { scent: 'Lemon', volumes: [250] },
      ],
    },
  ];

  for (const productData of productsData) {
    const { scents, ...productInfo } = productData;
    
    const product = await prisma.product.create({
      data: {
        ...productInfo,
      },
    });

    // Create variants for each scent and volume
    for (const scentData of scents) {
      for (const volume of scentData.volumes) {
        const priceMultiplier = volume === 100 ? 1 : volume === 250 ? 2.2 : 3.8;
        const price = Math.round(productInfo.basePrice * priceMultiplier);
        const salePrice = Math.random() > 0.6 ? Math.round(price * 0.85) : null;
        const stock = Math.floor(Math.random() * 50) + 10;

        await prisma.productVariant.create({
          data: {
            productId: product.id,
            sku: `${product.slug}-${scentData.scent.toLowerCase()}-${volume}ml`.toUpperCase(),
            scent: scentData.scent,
            volumeMl: volume,
            price,
            salePrice,
            stock,
          },
        });
      }
    }
  }

  console.log('✅ Created products with variants:', productsData.length);

  // Create Coupons
  const coupons = await Promise.all([
    prisma.coupon.create({
      data: {
        code: 'XIT10',
        type: 'PERCENT',
        value: 10,
        minOrder: 200000,
        maxDiscount: 50000,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2025-12-31'),
        maxUses: 1000,
      },
    }),
    prisma.coupon.create({
      data: {
        code: 'GIAM20K',
        type: 'FIXED',
        value: 20000,
        minOrder: 150000,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2025-12-31'),
        maxUses: 500,
      },
    }),
    prisma.coupon.create({
      data: {
        code: 'FREESHIP',
        type: 'FREESHIP',
        value: 30000,
        minOrder: 300000,
        validFrom: new Date('2024-01-01'),
        validUntil: new Date('2025-12-31'),
      },
    }),
  ]);

  console.log('✅ Created coupons:', coupons.length);

  // Create some reviews
  const products = await prisma.product.findMany({ take: 5 });
  for (const product of products) {
    await prisma.review.create({
      data: {
        userId: customer.id,
        productId: product.id,
        rating: 5,
        content: 'Sản phẩm rất tuyệt vời! Hương thơm dễ chịu, lưu lâu. Sẽ ủng hộ shop tiếp!',
        images: [],
      },
    });
  }

  console.log('✅ Created reviews');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

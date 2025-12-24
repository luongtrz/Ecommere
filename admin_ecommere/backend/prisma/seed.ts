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
        name: 'Xịt Diệt Côn Trùng',
        slug: 'xit-diet-con-trung',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Xịt Đuổi Động Vật',
        slug: 'xit-duoi-dong-vat',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Vệ Sinh Nhà Cửa',
        slug: 've-sinh-nha-cua',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Chăm Sóc Cá Nhân',
        slug: 'cham-soc-ca-nhan',
      },
    }),
    prisma.category.create({
      data: {
        name: 'Khử Mùi & Thơm Phòng',
        slug: 'khu-mui-thom-phong',
      },
    }),
  ]);

  console.log('✅ Created categories:', categories.length);

  // Shopee Products Data
  const shopeeProducts = [
    {
      name: 'Bình Xịt Diệt Mối - Côn Trùng Chaindrite 600ml (Combo 2 bình)',
      description: 'Bình xịt diệt mối và các loại côn trùng nhập khẩu 100% từ Thái Lan. An toàn cho người sử dụng, hiệu quả cao trong việc diệt mối, gián, ruồi muỗi.',
      brand: 'Chaindrite',
      categoryId: categories[0].id,
      images: ['https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lpsvbk8ayjf6c0.webp'],
      basePrice: 67379,
      originalPrice: 124776,
      rating: 4.9,
      soldCount: 5000,
      scents: [{ scent: 'Lavender', volumes: [600] }],
    },
    {
      name: 'Chai Xịt Diệt Nhện ARS 300ml',
      description: 'Chai xịt diệt nhện nhập khẩu Thái Lan, công nghệ Nhật Bản. Hiệu quả diệt nhện và côn trùng khác. Không mùi, an toàn.',
      brand: 'ARS',
      categoryId: categories[0].id,
      images: ['https://down-vn.img.susercontent.com/file/1f8297e94219e50b8c32bac9d3a90fa3.webp'],
      basePrice: 100999,
      originalPrice: 157811,
      rating: 4.8,
      soldCount: 5000,
      scents: [{ scent: 'Không mùi', volumes: [300] }],
    },
    {
      name: 'Chai Xịt Đuổi Thằn Lằn Green House (Hương Bạc Hà) 300ml',
      description: 'Chai xịt đuổi thằn lằn từ tinh dầu tự nhiên, hương bạc hà dễ chịu. Sản phẩm chính hãng, an toàn cho người và thú cưng.',
      brand: 'Green House',
      categoryId: categories[1].id,
      images: ['https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m6nh1xf05qag2d.webp'],
      basePrice: 109000,
      originalPrice: 149315,
      rating: 4.7,
      soldCount: 569,
      scents: [{ scent: 'Bạc Hà', volumes: [300] }],
    },
    {
      name: 'Chai xịt đuổi Chuột Thảo Dược 200ml + Bẫy Keo (Combo 2 SP)',
      description: 'Combo xịt đuổi chuột từ thảo dược tự nhiên kèm bẫy keo dính chuột. Hiệu quả cao, an toàn cho gia đình.',
      brand: 'Pest Control',
      categoryId: categories[1].id,
      images: ['https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-mcu7303dcwwsaf.webp'],
      basePrice: 49000,
      originalPrice: 49000,
      rating: 4.7,
      soldCount: 757,
      scents: [{ scent: 'Thảo Dược', volumes: [200] }],
    },
    {
      name: 'Chai Xịt Diệt Mối Mọt ARS JET TERMITE 600ml',
      description: 'Xịt diệt mối, mọt và các loại côn trùng. Công nghệ Nhật Bản, nhập khẩu Thái Lan. Hiệu quả lâu dài.',
      brand: 'ARS',
      categoryId: categories[0].id,
      images: ['https://down-vn.img.susercontent.com/file/56b7c19de1a3488a05155e6ef238c1e9.webp'],
      basePrice: 79000,
      originalPrice: 129508,
      rating: 4.9,
      soldCount: 1000,
      scents: [{ scent: 'Không mùi', volumes: [600] }],
    },
    {
      name: 'Bình Xịt Diệt Mối Chaindrite + Nước rửa chén Lipon 150ml',
      description: 'Bình xịt diệt mối Chaindrite kèm quà tặng nước rửa chén Lipon. Sản phẩm nhập khẩu Thái Lan, an toàn hiệu quả.',
      brand: 'Chaindrite',
      categoryId: categories[0].id,
      images: ['https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-m1kzn14q1sgjf6.webp'],
      basePrice: 78900,
      originalPrice: 125238,
      rating: 4.8,
      soldCount: 828,
      scents: [{ scent: 'Lavender', volumes: [600] }],
    },
    {
      name: 'Bình Xịt Mối Chaindrite 600ml (Hương Lavender)',
      description: 'Bình xịt diệt mối và côn trùng Chaindrite Thái Lan. Hương Lavender thơm dịu, an toàn cho người sử dụng.',
      brand: 'Chaindrite',
      categoryId: categories[0].id,
      images: ['https://down-vn.img.susercontent.com/file/3319573e21148406a1b059d4552afe60.webp'],
      basePrice: 77420,
      originalPrice: 124871,
      rating: 4.9,
      soldCount: 1000,
      scents: [{ scent: 'Lavender', volumes: [600] }],
    },
    {
      name: 'Bình xịt Diệt Gián Chaindrite 600ml',
      description: 'Bình xịt diệt gián và các loại côn trùng. Công thức mạnh mẽ từ Thái Lan, an toàn cho gia đình.',
      brand: 'Chaindrite',
      categoryId: categories[0].id,
      images: ['https://down-vn.img.susercontent.com/file/3e0b808a37e794a09fe1e9fd3bfd5f4f.webp'],
      basePrice: 55693,
      originalPrice: 123762,
      rating: 4.8,
      soldCount: 875,
      scents: [{ scent: 'Không mùi', volumes: [600] }],
    },
    {
      name: 'Bình xịt vệ sinh bếp Kitchen Clear 500ml',
      description: 'Bình xịt vệ sinh bếp bọt tuyết đa năng. Chai vàng cực mạnh, làm sạch dầu mỡ bám bẩn hiệu quả.',
      brand: 'Kitchen Clear',
      categoryId: categories[2].id,
      images: ['https://down-vn.img.susercontent.com/file/8c9ec1acd7a10524a1f5e2e3b114fc46.webp'],
      basePrice: 39000,
      originalPrice: 57353,
      rating: 4.8,
      soldCount: 488,
      scents: [{ scent: 'Chanh', volumes: [500] }],
    },
    {
      name: 'Bình xịt Côn Trùng Bengal Pro Max 500ml',
      description: 'Diệt 8 loại côn trùng, không mùi. Sản phẩm được Bộ Y Tế cấp chứng nhận lưu hành, an toàn tuyệt đối.',
      brand: 'Bengal',
      categoryId: categories[0].id,
      images: ['https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-mar8k3clxlmp6b.webp'],
      basePrice: 13999,
      originalPrice: 18918,
      rating: 4.9,
      soldCount: 92,
      scents: [{ scent: 'Không mùi', volumes: [500] }],
    },
    {
      name: 'Chai Xịt Đuổi Chuột ARS 300ml',
      description: 'Chai xịt đuổi chuột Thái Lan, công nghệ Nhật Bản 100%. Hiệu quả cao, an toàn cho người và thú cưng.',
      brand: 'ARS',
      categoryId: categories[1].id,
      images: ['https://down-vn.img.susercontent.com/file/173dc6a5103342f5925987c4ab69aa30.webp'],
      basePrice: 149000,
      originalPrice: 198667,
      rating: 4.9,
      soldCount: 1000,
      scents: [{ scent: 'Tinh dầu tự nhiên', volumes: [300] }],
    },
    {
      name: 'Túi Thơm Xá Xị (Combo 5 túi)',
      description: '100% từ bột gỗ xá xị. Khử mùi, giảm stress. Hương xá xị dịu nhẹ, làm thư giãn cho không gian sống.',
      brand: 'Natural Scent',
      categoryId: categories[4].id,
      images: ['https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lpsvbk8bb6j6a9.webp'],
      basePrice: 15900,
      originalPrice: 24844,
      rating: 4.8,
      soldCount: 985,
      scents: [{ scent: 'Xá Xị', volumes: [50] }],
    },
    {
      name: 'Chai Xịt Vệ Sinh Phòng Tắm Bathroom Cleaner 500ml',
      description: 'Chai xịt vệ sinh phòng tắm, tẩy rửa toilet bọt tuyết. Làm sạch cực mạnh, khử mùi hôi hiệu quả.',
      brand: 'Bathroom Cleaner',
      categoryId: categories[2].id,
      images: ['https://down-vn.img.susercontent.com/file/6d91b9360672d58a213a14277f055607.webp'],
      basePrice: 39000,
      originalPrice: 59091,
      rating: 4.9,
      soldCount: 342,
      scents: [{ scent: 'Bạc Hà', volumes: [500] }],
    },
    {
      name: 'Dung Dịch Vệ Sinh Phụ Nữ Nano AloVera 150ml',
      description: 'Hỗ trợ ngừa viêm nhiễm, làm sạch, dưỡng ẩm, giảm ngứa. Công nghệ Nano từ lô hội tự nhiên.',
      brand: 'Nano AloVera',
      categoryId: categories[3].id,
      images: ['https://down-vn.img.susercontent.com/file/vn-11134207-820l4-memmieqx4k5f27.webp'],
      basePrice: 126131,
      originalPrice: 172783,
      rating: 5.0,
      soldCount: 68,
      scents: [{ scent: 'Lô Hội', volumes: [150] }],
    },
    {
      name: 'Viên Tẩy Toilet (Bồn Cầu) Diệt Sạch Vi Khuẩn (10 viên)',
      description: 'Viên tẩy bồn cầu diệt sạch vi khuẩn, làm sạch và thơm tho nhà vệ sinh. Tiện lợi, hiệu quả cao.',
      brand: 'Toilet Cleaner',
      categoryId: categories[2].id,
      images: ['https://down-vn.img.susercontent.com/file/4709d6e2fd1a40129095434414944435.webp'],
      basePrice: 14500,
      originalPrice: 29000,
      rating: 4.8,
      soldCount: 960,
      scents: [{ scent: 'Hương Xanh', volumes: [100] }],
    },
    {
      name: 'Nước Rửa Bát Cao Cấp Không Mùi KLEANSY 500ml',
      description: 'Nước rửa bát Thái Lan tinh khiết, an toàn cho da tay. Có thể rửa được bình sữa trẻ em. Không mùi.',
      brand: 'KLEANSY',
      categoryId: categories[2].id,
      images: ['https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m7xfirijoeh0ae.webp'],
      basePrice: 25479,
      originalPrice: 34903,
      rating: 5.0,
      soldCount: 39,
      scents: [{ scent: 'Không mùi', volumes: [500] }],
    },
    {
      name: 'Bình Xịt Đuổi Thằn Lằn ARS Lizard Repellent 300ml',
      description: 'Xịt đuổi thằn lằn, thạch sùng, tắc kè, bò sát và rắn. Thương hiệu số 1 Nhật Bản, an toàn hiệu quả.',
      brand: 'ARS',
      categoryId: categories[1].id,
      images: ['https://down-vn.img.susercontent.com/file/vn-11134201-23030-5d85js4qhfov71.webp'],
      basePrice: 119000,
      originalPrice: 198333,
      rating: 4.6,
      soldCount: 1000,
      scents: [{ scent: 'Tinh dầu tự nhiên', volumes: [300] }],
    },
    {
      name: 'Nước rửa chén Teepol 500ml',
      description: 'Nước rửa chén Thái Lan siêu sạch, an toàn da tay. Cho bát đĩa sạch bóng kin kít.',
      brand: 'Teepol',
      categoryId: categories[2].id,
      images: ['https://down-vn.img.susercontent.com/file/vn-11134207-7ra0g-m6rxbzqzofnc41.webp'],
      basePrice: 11900,
      originalPrice: 15063,
      rating: 5.0,
      soldCount: 74,
      scents: [{ scent: 'Chanh', volumes: [500] }],
    },
    {
      name: 'Gel lột mụn than tre Kone 50g',
      description: 'Gel lột mụn than tre Thái Lan, hút bã nhờn sâu. Làm sạch lỗ chân lông hiệu quả.',
      brand: 'Kone',
      categoryId: categories[3].id,
      images: ['https://down-vn.img.susercontent.com/file/218c4aa85f13f80b06e78e11a3fbd15a.webp'],
      basePrice: 14493,
      originalPrice: 24988,
      rating: 4.8,
      soldCount: 995,
      scents: [{ scent: 'Than tre', volumes: [50] }],
    },
    {
      name: 'Nước cắm hoa ASA 400ml',
      description: 'Nước cắm hoa giúp hoa tươi lâu, không thối nước. Dưỡng chất tự nhiên cho hoa cắt cành.',
      brand: 'ASA',
      categoryId: categories[2].id,
      images: ['https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-m0pdcdtkjq8f63.webp'],
      basePrice: 42900,
      originalPrice: 54304,
      rating: 4.7,
      soldCount: 121,
      scents: [{ scent: 'Không mùi', volumes: [400] }],
    },
    {
      name: 'Bình Xịt Diệt Mối Chaindrite 600ml (Chính Hãng)',
      description: 'Bình xịt diệt mối và côn trùng nhập khẩu 100%. An toàn, hiệu quả cao, bán chạy nhất.',
      brand: 'Chaindrite',
      categoryId: categories[0].id,
      images: ['https://down-vn.img.susercontent.com/file/a47842e0fb2584134e0b7f1f6921bf59.webp'],
      basePrice: 77322,
      originalPrice: 99131,
      rating: 4.9,
      soldCount: 10000,
      scents: [{ scent: 'Lavender', volumes: [600] }],
    },
    {
      name: 'Bình xịt côn trùng ARS PRO.X 500ml (Combo 2 bình)',
      description: 'Bình xịt mạnh 7 trong 1. Thương hiệu số 1 Nhật Bản. Diệt toàn diện các loại côn trùng.',
      brand: 'ARS',
      categoryId: categories[0].id,
      images: ['https://down-vn.img.susercontent.com/file/61e69393a0d354a70e426c42cb8a19cf.webp'],
      basePrice: 139000,
      originalPrice: 180519,
      rating: 5.0,
      soldCount: 445,
      scents: [{ scent: 'Không mùi', volumes: [500] }],
    },
    {
      name: 'Nước Tẩy Nhà Tắm Vixol Oxy 700ml',
      description: 'Nước tẩy nhà tắm và bồn cầu Thái Lan. Công thức Oxy mạnh mẽ, làm sạch cực tốt.',
      brand: 'Vixol',
      categoryId: categories[2].id,
      images: ['https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lm8xhu4dh2an1f.webp'],
      basePrice: 44500,
      originalPrice: 59333,
      rating: 5.0,
      soldCount: 59,
      scents: [{ scent: 'Oxy', volumes: [700] }],
    },
    {
      name: 'Bình xịt côn trùng ARS 600ml (Không Mùi)',
      description: 'Bình xịt côn trùng công nghệ Nhật Bản, không mùi. An toàn cho gia đình có trẻ nhỏ.',
      brand: 'ARS',
      categoryId: categories[0].id,
      images: ['https://down-vn.img.susercontent.com/file/dfdecf4b6b28a1f50cd66f0984d35d5f.webp'],
      basePrice: 59000,
      originalPrice: 85507,
      rating: 5.0,
      soldCount: 103,
      scents: [{ scent: 'Không mùi', volumes: [600] }],
    },
    {
      name: 'Xịt đuổi chuột Rats & Pest Outs 200ml',
      description: 'Đuổi chuột tinh chất nồng độ cao, an toàn. Đuổi chuột ngay sau 1 đêm. Hiệu quả lâu dài.',
      brand: 'Rats & Pest Outs',
      categoryId: categories[1].id,
      images: ['https://down-vn.img.susercontent.com/file/vn-11134207-7qukw-ljo2tybf8n42ac.webp'],
      basePrice: 243774,
      originalPrice: 348249,
      rating: 4.7,
      soldCount: 196,
      scents: [{ scent: 'Tinh dầu thảo mộc', volumes: [200] }],
    },
    {
      name: 'Chai Xịt Côn Trùng ARS 600ml (Chính Hãng)',
      description: 'Chai xịt diệt gián, ruồi, muỗi không mùi. Nhập khẩu Thái Lan 100%, chất lượng cao.',
      brand: 'ARS',
      categoryId: categories[0].id,
      images: ['https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lncepv2lhbsdef.webp'],
      basePrice: 62720,
      originalPrice: 89600,
      rating: 4.9,
      soldCount: 38,
      scents: [{ scent: 'Không mùi', volumes: [600] }],
    },
    {
      name: 'Bình Xịt đuổi chuột Rat & Pest Oust 300ml',
      description: 'Đuổi chuột bằng tinh chất tự nhiên. Đuổi chuột 2 lớp bằng mùi và vị. An toàn tuyệt đối.',
      brand: 'Rat & Pest Oust',
      categoryId: categories[1].id,
      images: ['https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lmvh4w04pz33db.webp'],
      basePrice: 99000,
      originalPrice: 180000,
      rating: 4.6,
      soldCount: 97,
      scents: [{ scent: 'Tinh dầu tự nhiên', volumes: [300] }],
    },
    {
      name: 'Cốc thả bồn cầu Hàn Quốc Cao Cấp',
      description: 'Cốc thả bồn cầu khử mùi, làm thơm toilet. Sản phẩm Hàn Quốc cao cấp, bền lâu.',
      brand: 'Korea Fresh',
      categoryId: categories[2].id,
      images: ['https://down-vn.img.susercontent.com/file/232f2828f9d9e906ecff3add432f2b19.webp'],
      basePrice: 38000,
      originalPrice: 56716,
      rating: 4.8,
      soldCount: 480,
      scents: [{ scent: 'Hỗn hợp', volumes: [50] }],
    },
    {
      name: 'Sữa tắm than tre Cathy Doll 500ml',
      description: 'Sữa tắm mụn lưng, trắng da. Loại bỏ mụn lưng hiệu quả với than tre hoạt tính.',
      brand: 'Cathy Doll',
      categoryId: categories[3].id,
      images: ['https://down-vn.img.susercontent.com/file/e3295bdbf810dabedfb9ee8813d0024a.webp'],
      basePrice: 79900,
      originalPrice: 98642,
      rating: 4.9,
      soldCount: 2000,
      scents: [{ scent: 'Than tre', volumes: [500] }],
    },
    {
      name: 'Muối Tắm Sữa Bò A Bonne 350g',
      description: 'Muối tắm tẩy tế bào chết hiệu quả. Sạch bã nhờn, làm trắng da tự nhiên. Chính hãng Thái Lan.',
      brand: 'A Bonne',
      categoryId: categories[3].id,
      images: ['https://down-vn.img.susercontent.com/file/vn-11134207-7ras8-m438rybxbqn447.webp'],
      basePrice: 22998,
      originalPrice: 35382,
      rating: 4.9,
      soldCount: 967,
      scents: [{ scent: 'Sữa bò', volumes: [350] }],
    },
  ];

  console.log('✅ Starting to create products...');

  for (const productData of shopeeProducts) {
    const { scents, originalPrice, soldCount, rating, ...productInfo } = productData;
    
    // Generate slug from product name
    const slugify = (str: string) => 
      str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    
    const product = await prisma.product.create({
      data: {
        ...productInfo,
        slug: slugify(productInfo.name),
      },
    });

    // Create variants for each scent and volume
    for (const scentData of scents) {
      for (const volume of scentData.volumes) {
        const price = productInfo.basePrice;
        const salePrice = originalPrice > price ? null : price;
        const stock = Math.floor(Math.random() * 100) + 20;

        await prisma.productVariant.create({
          data: {
            productId: product.id,
            sku: `${product.slug}-${scentData.scent.toLowerCase().replace(/\s+/g, '-')}-${volume}ml`.toUpperCase(),
            scent: scentData.scent,
            volumeMl: volume,
            price: originalPrice > price ? originalPrice : price,
            salePrice: originalPrice > price ? price : null,
            stock,
          },
        });
      }
    }
  }

  console.log('✅ Created products with variants:', shopeeProducts.length);

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

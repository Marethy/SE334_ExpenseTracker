import { config } from "dotenv";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { createId } from "@paralleldrive/cuid2";
import { accounts, categories, subscriptions, transactions } from "@/db/schema";

config({ path: ".env.local" });

const getDatabaseUrl = () => {
  const url = process.env.DRIZZLE_DATABASE_URL;
  if (!url) {
    throw new Error("DRIZZLE_DATABASE_URL is not set");
  }
  console.log("🔌 Database URL:", url.replace(/:[^:@]*@/, ":***@"));
  return url;
};

const pool = new pg.Pool({
  connectionString: getDatabaseUrl(),
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const db = drizzle(pool);

const YOUR_USER_ID = "user_2z9DHMW3UKpwza1orMSp2eYZWyK";

const accountSeed = [
  { id: createId(), name: "Tài khoản Vietcombank", userId: YOUR_USER_ID },
  { id: createId(), name: "Tài khoản tiết kiệm BIDV", userId: YOUR_USER_ID },
  { id: createId(), name: "Thẻ tín dụng Techcombank", userId: YOUR_USER_ID },
  { id: createId(), name: "Ví MoMo", userId: YOUR_USER_ID },
  { id: createId(), name: "Ví ZaloPay", userId: YOUR_USER_ID },
  { id: createId(), name: "Tiền mặt", userId: YOUR_USER_ID },
];

const categorySeed = [
  { id: createId(), name: "Ăn uống", userId: YOUR_USER_ID },
  { id: createId(), name: "Đi lại", userId: YOUR_USER_ID },
  { id: createId(), name: "Mua sắm", userId: YOUR_USER_ID },
  { id: createId(), name: "Giải trí", userId: YOUR_USER_ID },
  { id: createId(), name: "Hóa đơn & Tiện ích", userId: YOUR_USER_ID },
  { id: createId(), name: "Y tế", userId: YOUR_USER_ID },
  { id: createId(), name: "Du lịch", userId: YOUR_USER_ID },
  { id: createId(), name: "Giáo dục", userId: YOUR_USER_ID },
  { id: createId(), name: "Sinh hoạt phẩm", userId: YOUR_USER_ID },
  { id: createId(), name: "Xăng xe", userId: YOUR_USER_ID },
  { id: createId(), name: "Cà phê & Đồ uống", userId: YOUR_USER_ID },
  { id: createId(), name: "Dịch vụ trực tuyến", userId: YOUR_USER_ID },
  { id: createId(), name: "Quà tặng & Từ thiện", userId: YOUR_USER_ID },
  { id: createId(), name: "Chăm sóc cá nhân", userId: YOUR_USER_ID },
  { id: createId(), name: "Thu nhập", userId: YOUR_USER_ID },
  { id: createId(), name: "Nhà ở", userId: YOUR_USER_ID },
  { id: createId(), name: "Bảo hiểm", userId: YOUR_USER_ID },
  { id: createId(), name: "Thể thao", userId: YOUR_USER_ID },
];

// Subscription cho bạn
const subscriptionSeed = [
  {
    id: createId(),
    userId: YOUR_USER_ID,
    plan: "premium",
    status: "active",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2025-12-31"),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Function để tạo realistic transaction data cho Việt Nam
const createTransactionSeed = () => {
  const transactions = [];
  const now = new Date();

  // Các loại thu nhập phổ biến ở Việt Nam
  const incomePayees = [
    "Lương tháng",
    "Thưởng dự án",
    "Freelance",
    "Kinh doanh online",
    "Đầu tư",
    "Làm thêm",
    "Lãi tiết kiệm",
    "Bán hàng",
    "Dạy học",
    "Thiết kế website",
  ];

  // Các loại chi tiêu với category tương ứng (số tiền theo VND)
  const expenseData = [
    {
      payees: [
        "Highlands Coffee",
        "Starbucks",
        "Cộng Cà Phê",
        "Trà sữa TocoToco",
        "Phúc Long",
        "Cà phê vỉa hè",
      ],
      category: "Cà phê & Đồ uống",
      amountRange: [25000, 120000], // 25k-120k VND
    },
    {
      payees: [
        "Grab Food",
        "ShopeeFood",
        "Bún chả Hương Liên",
        "Phở Thìn",
        "Lotteria",
        "KFC",
        "McDonald's",
        "Quán cơm tấm",
        "Nhà hàng BBQ",
        "Buffet lẩu",
      ],
      category: "Ăn uống",
      amountRange: [50000, 800000], // 50k-800k VND
    },
    {
      payees: [
        "Vinmart",
        "Co.opmart",
        "Big C",
        "Lotte Mart",
        "Mega Market",
        "Circle K",
        "FamilyMart",
        "Chợ Bến Thành",
      ],
      category: "Sinh hoạt phẩm",
      amountRange: [100000, 2000000], // 100k-2M VND
    },
    {
      payees: [
        "Grab Bike",
        "Grab Car",
        "Be",
        "Gojek",
        "Xe buýt",
        "Xe ôm",
        "Taxi Mai Linh",
        "Vinasun",
      ],
      category: "Đi lại",
      amountRange: [15000, 300000], // 15k-300k VND
    },
    {
      payees: ["Petrolimex", "Shell", "Caltex", "VinFast", "BP", "Total"],
      category: "Xăng xe",
      amountRange: [200000, 1500000], // 200k-1.5M VND
    },
    {
      payees: [
        "Shopee",
        "Lazada",
        "Tiki",
        "Sendo",
        "Vincom",
        "Takashimaya",
        "Saigon Centre",
        "Diamond Plaza",
        "Uniqlo",
        "H&M",
      ],
      category: "Mua sắm",
      amountRange: [150000, 5000000], // 150k-5M VND
    },
    {
      payees: [
        "Netflix",
        "Spotify",
        "YouTube Premium",
        "VTV Cab",
        "FPT Play",
        "Zing MP3",
        "VIP Karaoke",
      ],
      category: "Dịch vụ trực tuyến",
      amountRange: [79000, 400000], // 79k-400k VND
    },
    {
      payees: [
        "Hóa đơn điện EVN",
        "Hóa đơn nước",
        "Internet FPT",
        "Viettel",
        "VinaPhone",
        "MobiFone",
        "Tiền nhà",
        "Phí quản lý chung cư",
      ],
      category: "Hóa đơn & Tiện ích",
      amountRange: [300000, 3000000], // 300k-3M VND
    },
    {
      payees: [
        "CGV Cinemas",
        "Lotte Cinema",
        "Galaxy Cinema",
        "Game center",
        "Karaoke Luxury",
        "Bowling",
        "Concert",
        "Nhà hát",
      ],
      category: "Giải trí",
      amountRange: [200000, 1500000], // 200k-1.5M VND
    },
    {
      payees: [
        "Bệnh viện Chợ Rẫy",
        "Bệnh viện Ung Bướu",
        "Phòng khám đa khoa",
        "Nha khoa Paris",
        "Nhà thuốc Long Châu",
        "Pharmacity",
        "Guardian",
      ],
      category: "Y tế",
      amountRange: [100000, 5000000], // 100k-5M VND
    },
    {
      payees: [
        "Vietnam Airlines",
        "VietJet Air",
        "Bamboo Airways",
        "Khách sạn",
        "Homestay",
        "Tour du lịch",
        "Vé tham quan",
      ],
      category: "Du lịch",
      amountRange: [500000, 15000000], // 500k-15M VND
    },
    {
      payees: [
        "Học phí đại học",
        "Khóa học online",
        "Sách giáo khoa",
        "Khoá học tiếng Anh",
        "Học lái xe",
        "Trung tâm tin học",
      ],
      category: "Giáo dục",
      amountRange: [200000, 10000000], // 200k-10M VND
    },
    {
      payees: [
        "Gym California",
        "Yoga Center",
        "Sân tennis",
        "Hồ bơi",
        "Sân cầu lông",
        "Phòng tập boxing",
      ],
      category: "Thể thao",
      amountRange: [100000, 2000000], // 100k-2M VND
    },
    {
      payees: [
        "Bảo hiểm Prudential",
        "Bảo Việt",
        "AIA",
        "Manulife",
        "Bảo hiểm xe máy",
        "Bảo hiểm y tế",
      ],
      category: "Bảo hiểm",
      amountRange: [500000, 5000000], // 500k-5M VND
    },
  ];

  // Tạo transactions cho 90 ngày qua (3 tháng)
  for (let i = 0; i < 90; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);

    // Random số lượng transactions mỗi ngày (ít hơn vào cuối tuần)
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const numTransactions = isWeekend
      ? Math.floor(Math.random() * 4) + 1 // 1-4 transactions cuối tuần
      : Math.floor(Math.random() * 7) + 2; // 2-8 transactions ngày thường

    for (let j = 0; j < numTransactions; j++) {
      const isIncome = Math.random() < 0.12; // 12% chance là thu nhập

      if (isIncome) {
        // Tạo income transaction
        const isLargeSalary = Math.random() < 0.1; // 10% chance lương lớn

        let amount, payee;
        if (isLargeSalary) {
          amount = Math.floor(Math.random() * 30000000) + 15000000; // 15M-45M VND (lương tháng)
          payee = "Lương tháng";
        } else {
          amount = Math.floor(Math.random() * 5000000) + 500000; // 500k-5.5M VND
          payee = incomePayees[Math.floor(Math.random() * incomePayees.length)];
        }

        const incomeCategory = categorySeed.find(
          (cat) => cat.name === "Thu nhập"
        );

        transactions.push({
          id: createId(),
          amount: amount.toString(),
          payee,
          notes: "Thu nhập",
          date,
          accountId:
            accountSeed[Math.floor(Math.random() * accountSeed.length)].id,
          categoryId: incomeCategory?.id || null,
        });
      } else {
        // Tạo expense transaction
        const expenseType =
          expenseData[Math.floor(Math.random() * expenseData.length)];
        const payee =
          expenseType.payees[
            Math.floor(Math.random() * expenseType.payees.length)
          ];
        const amount = -(
          Math.floor(
            Math.random() *
              (expenseType.amountRange[1] - expenseType.amountRange[0])
          ) + expenseType.amountRange[0]
        );
        const category = categorySeed.find(
          (cat) => cat.name === expenseType.category
        );

        transactions.push({
          id: createId(),
          amount: amount.toString(),
          payee,
          notes: `Chi tiêu ${expenseType.category}`,
          date,
          accountId:
            accountSeed[Math.floor(Math.random() * accountSeed.length)].id,
          categoryId: category?.id || null,
        });
      }
    }

    // Thêm vài chi tiêu lớn đặc biệt (tiền nhà, etc.)
    if (Math.random() < 0.03) {
      // 3% chance mỗi ngày
      const largeExpenses = [
        {
          payee: "Tiền thuê nhà",
          amount: -(Math.floor(Math.random() * 8000000) + 5000000), // 5M-13M VND
          category: "Nhà ở",
        },
        {
          payee: "Mua xe máy",
          amount: -(Math.floor(Math.random() * 50000000) + 20000000), // 20M-70M VND
          category: "Mua sắm",
        },
        {
          payee: "Sửa chữa nhà",
          amount: -(Math.floor(Math.random() * 15000000) + 5000000), // 5M-20M VND
          category: "Nhà ở",
        },
      ];

      const largeExpense =
        largeExpenses[Math.floor(Math.random() * largeExpenses.length)];
      const category = categorySeed.find(
        (cat) => cat.name === largeExpense.category
      );

      transactions.push({
        id: createId(),
        amount: largeExpense.amount.toString(),
        payee: largeExpense.payee,
        notes: "Chi tiêu lớn",
        date,
        accountId: accountSeed[2].id, // Thẻ tín dụng
        categoryId: category?.id || null,
      });
    }
  }

  return transactions;
};

async function seed() {
  try {
    console.log("🔄 Bắt đầu seed database...");
    console.log(`👤 Tạo dữ liệu cho user: ${YOUR_USER_ID}`);

    // Test connection
    const client = await pool.connect();
    console.log("✅ Kết nối database thành công");
    client.release();

    console.log("🧹 Xóa dữ liệu cũ...");
    await db.delete(transactions).execute();
    await db.delete(subscriptions).execute();
    await db.delete(categories).execute();
    await db.delete(accounts).execute();
    console.log("✅ Đã xóa dữ liệu cũ");

    console.log("🌱 Tạo tài khoản...");
    await db.insert(accounts).values(accountSeed).execute();
    console.log(`✅ Đã tạo ${accountSeed.length} tài khoản`);

    console.log("🌱 Tạo danh mục...");
    await db.insert(categories).values(categorySeed).execute();
    console.log(`✅ Đã tạo ${categorySeed.length} danh mục`);

    console.log("🌱 Tạo subscription...");
    await db.insert(subscriptions).values(subscriptionSeed).execute();
    console.log(`✅ Đã tạo ${subscriptionSeed.length} subscription`);

    console.log("🌱 Tạo giao dịch...");
    const transactionSeed = createTransactionSeed();

    // Insert transactions theo batch
    const batchSize = 100;
    for (let i = 0; i < transactionSeed.length; i += batchSize) {
      const batch = transactionSeed.slice(i, i + batchSize);
      await db.insert(transactions).values(batch).execute();
      console.log(
        `   📦 Đã tạo batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(transactionSeed.length / batchSize)}`
      );
    }
    console.log(`✅ Đã tạo ${transactionSeed.length} giao dịch`);

    console.log("\n🎉 Seed hoàn thành!");
    console.log("📊 Tóm tắt dữ liệu:");
    console.log(`   👤 User: ${YOUR_USER_ID}`);
    console.log(
      `   🏦 ${accountSeed.length} tài khoản (Vietcombank, BIDV, MoMo, ZaloPay...)`
    );
    console.log(
      `   📂 ${categorySeed.length} danh mục (Ăn uống, Đi lại, Y tế...)`
    );
    console.log(`   💎 ${subscriptionSeed.length} subscription (Premium)`);
    console.log(`   💰 ${transactionSeed.length} giao dịch`);
    console.log(`   📅 Dữ liệu: 90 ngày gần nhất`);
    console.log(`   💵 Tiền tệ: VND (Việt Nam Đồng)`);

    console.log("\n🚀 Bây giờ bạn có thể:");
    console.log("   • Đăng nhập vào ứng dụng");
    console.log("   • Xem dashboard với dữ liệu thực tế");
    console.log("   • Test tất cả tính năng với giao dịch VND");
    console.log("   • Xem biểu đồ thu chi 3 tháng qua");
  } catch (err) {
    console.error("❌ Seed thất bại:", err);
    process.exit(1);
  } finally {
    await pool.end();
    console.log("🔐 Đã đóng kết nối database");
  }
}

// Chạy seed
seed();

import { config } from "dotenv";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { createId } from "@paralleldrive/cuid2";
import { accounts, categories, subscriptions, transactions } from "@/db/schema";

// Load environment variables
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

// User ID thực của bạn
const YOUR_USER_ID = "user_2z9DHMW3UKpwza1orMSp2eYZWyK";

// Seed data cho accounts - tất cả sẽ thuộc về bạn
const accountSeed = [
  { id: createId(), name: "Main Checking", userId: YOUR_USER_ID },
  { id: createId(), name: "Savings Account", userId: YOUR_USER_ID },
  { id: createId(), name: "Credit Card", userId: YOUR_USER_ID },
  { id: createId(), name: "Investment Portfolio", userId: YOUR_USER_ID },
  { id: createId(), name: "Emergency Fund", userId: YOUR_USER_ID },
];

// Seed data cho categories - tất cả thuộc về bạn
const categorySeed = [
  { id: createId(), name: "Food & Dining", userId: YOUR_USER_ID },
  { id: createId(), name: "Transportation", userId: YOUR_USER_ID },
  { id: createId(), name: "Shopping", userId: YOUR_USER_ID },
  { id: createId(), name: "Entertainment", userId: YOUR_USER_ID },
  { id: createId(), name: "Bills & Utilities", userId: YOUR_USER_ID },
  { id: createId(), name: "Healthcare", userId: YOUR_USER_ID },
  { id: createId(), name: "Travel", userId: YOUR_USER_ID },
  { id: createId(), name: "Education", userId: YOUR_USER_ID },
  { id: createId(), name: "Groceries", userId: YOUR_USER_ID },
  { id: createId(), name: "Gas & Fuel", userId: YOUR_USER_ID },
  { id: createId(), name: "Coffee & Drinks", userId: YOUR_USER_ID },
  { id: createId(), name: "Subscriptions", userId: YOUR_USER_ID },
  { id: createId(), name: "Gifts & Donations", userId: YOUR_USER_ID },
  { id: createId(), name: "Personal Care", userId: YOUR_USER_ID },
  { id: createId(), name: "Income", userId: YOUR_USER_ID },
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

// Function để tạo realistic transaction data
const createTransactionSeed = () => {
  const transactions = [];
  const now = new Date();

  // Các loại income
  const incomePayees = [
    "Salary Payment",
    "Freelance Project",
    "Investment Dividend",
    "Side Hustle Income",
    "Bonus Payment",
    "Consulting Fee",
    "Interest Payment",
  ];

  // Các loại expense với category tương ứng
  const expenseData = [
    {
      payees: ["Starbucks", "Local Coffee Shop", "Dunkin Donuts"],
      category: "Coffee & Drinks",
      amountRange: [50, 200],
    },
    {
      payees: [
        "Grab Food",
        "McDonalds",
        "KFC",
        "Pizza Hut",
        "Local Restaurant",
      ],
      category: "Food & Dining",
      amountRange: [100, 800],
    },
    {
      payees: ["BigC", "Vinmart", "Co.opmart", "Lotte Mart"],
      category: "Groceries",
      amountRange: [200, 1500],
    },
    {
      payees: ["Grab", "Uber", "Xe Om", "Bus Fare"],
      category: "Transportation",
      amountRange: [30, 300],
    },
    {
      payees: ["Petrolimex", "Shell", "Chevron"],
      category: "Gas & Fuel",
      amountRange: [200, 800],
    },
    {
      payees: ["Shopee", "Lazada", "Tiki", "Amazon"],
      category: "Shopping",
      amountRange: [150, 2000],
    },
    {
      payees: ["Netflix", "Spotify", "YouTube Premium", "Disney+"],
      category: "Subscriptions",
      amountRange: [99, 299],
    },
    {
      payees: ["Electric Bill", "Water Bill", "Internet Bill", "Phone Bill"],
      category: "Bills & Utilities",
      amountRange: [300, 1200],
    },
    {
      payees: ["Cinema", "Game Store", "Concert Ticket"],
      category: "Entertainment",
      amountRange: [200, 1000],
    },
    {
      payees: ["Pharmacy", "Hospital", "Doctor Visit"],
      category: "Healthcare",
      amountRange: [150, 2000],
    },
    {
      payees: ["Flight Booking", "Hotel", "Travel Agency"],
      category: "Travel",
      amountRange: [500, 5000],
    },
  ];

  // Tạo transactions cho 60 ngày qua để có nhiều data hơn
  for (let i = 0; i < 60; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);

    // Random số lượng transactions mỗi ngày
    const numTransactions = Math.floor(Math.random() * 6) + 1; // 1-6 transactions per day

    for (let j = 0; j < numTransactions; j++) {
      const isIncome = Math.random() < 0.15; // 15% chance là income

      if (isIncome) {
        // Tạo income transaction
        const amount = Math.floor(Math.random() * 80000) + 20000; // 20k-100k VND
        const payee =
          incomePayees[Math.floor(Math.random() * incomePayees.length)];
        const incomeCategory = categorySeed.find(
          (cat) => cat.name === "Income"
        );

        transactions.push({
          id: createId(),
          amount,
          payee,
          notes: "Income transaction",
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
          amount,
          payee,
          notes: `${expenseType.category} expense`,
          date,
          accountId:
            accountSeed[Math.floor(Math.random() * accountSeed.length)].id,
          categoryId: category?.id || null,
        });
      }
    }

    // Thêm vài transactions lớn thỉnh thoảng
    if (Math.random() < 0.1) {
      // 10% chance
      const isLargeIncome = Math.random() < 0.7; // 70% chance large income vs large expense

      if (isLargeIncome) {
        transactions.push({
          id: createId(),
          amount: Math.floor(Math.random() * 500000) + 100000, // 100k-600k VND
          payee: "Monthly Salary",
          notes: "Monthly salary payment",
          date,
          accountId: accountSeed[0].id, // Main checking account
          categoryId:
            categorySeed.find((cat) => cat.name === "Income")?.id || null,
        });
      } else {
        transactions.push({
          id: createId(),
          amount: -(Math.floor(Math.random() * 50000) + 10000), // -10k to -60k VND
          payee: "Major Purchase",
          notes: "Large expense",
          date,
          accountId: accountSeed[2].id, // Credit card
          categoryId:
            categorySeed.find((cat) => cat.name === "Shopping")?.id || null,
        });
      }
    }
  }

  return transactions;
};

async function seed() {
  try {
    console.log("🔄 Starting database seed...");
    console.log(`👤 Seeding data for user: ${YOUR_USER_ID}`);

    // Test connection
    const client = await pool.connect();
    console.log("✅ Database connection successful");
    client.release();

    console.log("🧹 Clearing existing data...");
    await db.delete(transactions).execute();
    await db.delete(subscriptions).execute();
    await db.delete(categories).execute();
    await db.delete(accounts).execute();
    console.log("✅ Existing data cleared");

    console.log("🌱 Seeding accounts...");
    await db.insert(accounts).values(accountSeed).execute();
    console.log(`✅ Inserted ${accountSeed.length} accounts`);

    console.log("🌱 Seeding categories...");
    await db.insert(categories).values(categorySeed).execute();
    console.log(`✅ Inserted ${categorySeed.length} categories`);

    console.log("🌱 Seeding subscriptions...");
    await db.insert(subscriptions).values(subscriptionSeed).execute();
    console.log(`✅ Inserted ${subscriptionSeed.length} subscriptions`);

    console.log("🌱 Generating and seeding transactions...");
    const transactionSeed = createTransactionSeed();

    // Insert transactions in batches
    const batchSize = 100;
    for (let i = 0; i < transactionSeed.length; i += batchSize) {
      const batch = transactionSeed.slice(i, i + batchSize);
      await db.insert(transactions).values(batch).execute();
      console.log(
        `   📦 Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(transactionSeed.length / batchSize)}`
      );
    }
    console.log(`✅ Inserted ${transactionSeed.length} transactions`);

    console.log("\n🎉 Seed completed successfully!");
    console.log("📊 Summary:");
    console.log(`   👤 User: ${YOUR_USER_ID}`);
    console.log(`   🏦 ${accountSeed.length} accounts`);
    console.log(`   📂 ${categorySeed.length} categories`);
    console.log(`   💳 ${subscriptionSeed.length} subscription (Premium)`);
    console.log(`   💰 ${transactionSeed.length} transactions`);
    console.log(`   📅 Data range: Last 60 days`);

    console.log("\n🚀 You can now:");
    console.log("   • Login to your app");
    console.log("   • View your dashboard with real data");
    console.log("   • Test all features with realistic transactions");
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
    console.log("🔐 Database connection closed");
  }
}

// Chạy seed
seed();

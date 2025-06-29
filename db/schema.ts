import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, index, decimal } from "drizzle-orm/pg-core";

export const accounts = pgTable(
  "accounts",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    userId: text("user_id").notNull(),
  },
  (table) => ({
    userIdIdx: index("accounts_user_id_idx").on(table.userId),
    nameIdx: index("accounts_name_idx").on(table.name),
  })
);

export const categories = pgTable(
  "categories",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    userId: text("user_id").notNull(),
  },
  (table) => ({
    userIdIdx: index("categories_user_id_idx").on(table.userId),
    nameIdx: index("categories_name_idx").on(table.name),
  })
);

export const transactions = pgTable(
  "transactions",
  {
    id: text("id").primaryKey(),
    // Sử dụng decimal với precision và scale cho VND (tối đa 999 tỷ VND)
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    payee: text("payee").notNull(),
    notes: text("notes"),
    date: timestamp("date", { mode: "date" }).notNull(),
    accountId: text("account_id")
      .references(() => accounts.id, {
        onDelete: "cascade",
      })
      .notNull(),
    categoryId: text("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
  },
  (table) => ({
    accountIdIdx: index("transactions_account_id_idx").on(table.accountId),
    categoryIdIdx: index("transactions_category_id_idx").on(table.categoryId),
    dateIdx: index("transactions_date_idx").on(table.date.desc()),
    amountIdx: index("transactions_amount_idx").on(table.amount),
    payeeIdx: index("transactions_payee_idx").on(table.payee),
    accountDateIdx: index("transactions_account_date_idx").on(
      table.accountId,
      table.date.desc()
    ),
    accountCategoryIdx: index("transactions_account_category_idx").on(
      table.accountId,
      table.categoryId
    ),
    dateAmountIdx: index("transactions_date_amount_idx").on(
      table.date.desc(),
      table.amount
    ),
  })
);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().unique(),
    plan: text("plan").notNull().default("free"),
    status: text("status").notNull().default("active"),
    startDate: timestamp("start_date", { mode: "date" }).notNull(),
    endDate: timestamp("end_date", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow(),
  },
  (table) => ({
    userIdIdx: index("subscriptions_user_id_idx").on(table.userId),
    statusIdx: index("subscriptions_status_idx").on(table.status),
    planIdx: index("subscriptions_plan_idx").on(table.plan),
  })
);

// Relations
export const accountsRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

// Zod schemas - Cập nhật để hỗ trợ VND properly
export const insertAccountSchema = createInsertSchema(accounts, {
  name: z.string().min(1, "Account name is required"),
  userId: z.string().min(1, "User ID is required"),
});

export const insertCategorySchema = createInsertSchema(categories, {
  name: z.string().min(1, "Category name is required"),
  userId: z.string().min(1, "User ID is required"),
});

export const insertTransactionSchema = createInsertSchema(transactions, {
  amount: z
    .union([z.string(), z.number()])
    .refine(
      (val) => {
        const num = typeof val === "string" ? parseFloat(val) : val;
        return !isNaN(num) && isFinite(num);
      },
      { message: "Amount must be a valid number" }
    )
    .transform((val) => {
      const num = typeof val === "string" ? parseFloat(val) : val;
      return num.toFixed(2); // Store as decimal string
    }),
  payee: z.string().min(1, "Payee is required"),
  notes: z.string().optional(),
  date: z.coerce.date(),
  accountId: z.string().min(1, "Account is required"),
  categoryId: z.string().optional(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions, {
  userId: z.string().min(1, "User ID is required"),
  plan: z.string().default("free"),
  status: z.string().default("active"),
});

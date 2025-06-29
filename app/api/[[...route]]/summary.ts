import { z } from "zod";
import { Hono } from "hono";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { getAuth } from "@hono/clerk-auth";
import { subDays, parse, differenceInDays } from "date-fns";

import { db } from "@/db/drizzle";
import { accounts, categories, transactions } from "@/db/schema";
import { calculatePercentageChange, fillMissingDays } from "@/lib/utils";

const app = new Hono().get(
  "/",
  zValidator(
    "query",
    z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      accountId: z.string().optional(),
    })
  ),
  async (c) => {
    const auth = getAuth(c);
    const { from, to, accountId } = c.req.valid("query");

    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const defaultTo = new Date();
    const defaultFrom = subDays(defaultTo, 30);
    const startDate = from
      ? parse(from, "yyyy-MM-dd", new Date())
      : defaultFrom;
    const endDate = to ? parse(to, "yyyy-MM-dd", new Date()) : defaultTo;
    const periodLength = differenceInDays(endDate, startDate) + 1;
    const lastPeriodStart = subDays(startDate, periodLength);
    const lastPeriodEnd = subDays(endDate, periodLength);

    try {
      // Sử dụng Promise.all để chạy song song thay vì tuần tự
      const [currentPeriodData, lastPeriodData, categoryData, activeDaysData] =
        await Promise.all([
          // Current period financial data
          db
            .select({
              income:
                sql`SUM(CASE WHEN ${transactions.amount} >= 0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(
                  Number
                ),
              expenses:
                sql`SUM(CASE WHEN ${transactions.amount} < 0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(
                  Number
                ),
              remaining: sql`SUM(${transactions.amount})`.mapWith(Number),
            })
            .from(transactions)
            .innerJoin(accounts, eq(transactions.accountId, accounts.id))
            .where(
              and(
                accountId ? eq(transactions.accountId, accountId) : undefined,
                eq(accounts.userId, auth.userId),
                gte(transactions.date, startDate),
                lte(transactions.date, endDate)
              )
            ),

          // Last period financial data
          db
            .select({
              income:
                sql`SUM(CASE WHEN ${transactions.amount} >= 0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(
                  Number
                ),
              expenses:
                sql`SUM(CASE WHEN ${transactions.amount} < 0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(
                  Number
                ),
              remaining: sql`SUM(${transactions.amount})`.mapWith(Number),
            })
            .from(transactions)
            .innerJoin(accounts, eq(transactions.accountId, accounts.id))
            .where(
              and(
                accountId ? eq(transactions.accountId, accountId) : undefined,
                eq(accounts.userId, auth.userId),
                gte(transactions.date, lastPeriodStart),
                lte(transactions.date, lastPeriodEnd)
              )
            ),

          // Categories data
          db
            .select({
              name: categories.name,
              value: sql`SUM(ABS(${transactions.amount}))`.mapWith(Number),
            })
            .from(transactions)
            .innerJoin(accounts, eq(transactions.accountId, accounts.id))
            .innerJoin(categories, eq(transactions.categoryId, categories.id))
            .where(
              and(
                accountId ? eq(transactions.accountId, accountId) : undefined,
                eq(accounts.userId, auth.userId),
                sql`${transactions.amount} < 0`,
                gte(transactions.date, startDate),
                lte(transactions.date, endDate)
              )
            )
            .groupBy(categories.name)
            .orderBy(desc(sql`SUM(ABS(${transactions.amount}))`))
            .limit(10), // Giới hạn để tránh tải quá nhiều data

          // Active days data
          db
            .select({
              date: transactions.date,
              income:
                sql`SUM(CASE WHEN ${transactions.amount} >= 0 THEN ${transactions.amount} ELSE 0 END)`.mapWith(
                  Number
                ),
              expenses:
                sql`SUM(CASE WHEN ${transactions.amount} < 0 THEN ABS(${transactions.amount}) ELSE 0 END)`.mapWith(
                  Number
                ),
            })
            .from(transactions)
            .innerJoin(accounts, eq(transactions.accountId, accounts.id))
            .where(
              and(
                accountId ? eq(transactions.accountId, accountId) : undefined,
                eq(accounts.userId, auth.userId),
                gte(transactions.date, startDate),
                lte(transactions.date, endDate)
              )
            )
            .groupBy(transactions.date)
            .orderBy(transactions.date),
        ]);

      // Xử lý data
      const [currentPeriod] = currentPeriodData;
      const [lastPeriod] = lastPeriodData;

      const incomeChange = calculatePercentageChange(
        currentPeriod.income,
        lastPeriod.income
      );
      const expensesChange = calculatePercentageChange(
        currentPeriod.expenses,
        lastPeriod.expenses
      );
      const remainingChange = calculatePercentageChange(
        currentPeriod.remaining,
        lastPeriod.remaining
      );

      // Process categories
      const topCategories = categoryData.slice(0, 3);
      const otherCategories = categoryData.slice(3);
      const otherSum = otherCategories.reduce(
        (sum, current) => sum + current.value,
        0
      );

      const finalCategories = topCategories;
      if (otherCategories.length > 0) {
        finalCategories.push({ name: "Other", value: otherSum });
      }

      const days = fillMissingDays(activeDaysData, startDate, endDate);

      return c.json({
        data: {
          remainingAmount: currentPeriod.remaining,
          remainingChange,
          incomeAmount: currentPeriod.income,
          incomeChange,
          expensesAmount: currentPeriod.expenses,
          expensesChange,
          categories: finalCategories,
          days,
        },
      });
    } catch (error) {
      console.error("Summary API Error:", error);
      return c.json({ error: "Internal Server Error" }, 500);
    }
  }
);

export default app;

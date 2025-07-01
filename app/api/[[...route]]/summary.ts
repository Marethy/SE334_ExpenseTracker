export const dynamic = 'force-dynamic';
import { z } from "zod";
import { Hono } from "hono";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { zValidator } from "@hono/zod-validator";
import { getAuth } from "@hono/clerk-auth";
import { subDays, parse, differenceInDays } from "date-fns";

import { db } from "@/db/drizzle";
import { accounts, categories, transactions } from "@/db/schema";
import {
  calculatePercentageChange,
  fillMissingDays,
  parseAmountFromDB,
} from "@/lib/utils";

const app = new Hono().get(
  "/",
  zValidator(
    "query",
    z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      accountId: z.string().optional(),
      sort: z.enum(["amount", "count"]).optional(),
      limit: z.coerce.number().optional(),
    })
  ),
  async (c) => {
    const auth = getAuth(c);
    const { from, to, accountId, sort = "amount", limit } = c.req.valid("query");

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
                sql`SUM(CASE WHEN CAST(${transactions.amount} AS DECIMAL) >= 0 THEN CAST(${transactions.amount} AS DECIMAL) ELSE 0 END)`.mapWith(
                  (value) => parseAmountFromDB(value?.toString() || "0")
                ),
              expenses:
                sql`SUM(CASE WHEN CAST(${transactions.amount} AS DECIMAL) < 0 THEN CAST(${transactions.amount} AS DECIMAL) ELSE 0 END)`.mapWith(
                  (value) => parseAmountFromDB(value?.toString() || "0")
                ),
              remaining:
                sql`SUM(CAST(${transactions.amount} AS DECIMAL))`.mapWith(
                  (value) => parseAmountFromDB(value?.toString() || "0")
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
            ),

          // Last period financial data
          db
            .select({
              income:
                sql`SUM(CASE WHEN CAST(${transactions.amount} AS DECIMAL) >= 0 THEN CAST(${transactions.amount} AS DECIMAL) ELSE 0 END)`.mapWith(
                  (value) => parseAmountFromDB(value?.toString() || "0")
                ),
              expenses:
                sql`SUM(CASE WHEN CAST(${transactions.amount} AS DECIMAL) < 0 THEN CAST(${transactions.amount} AS DECIMAL) ELSE 0 END)`.mapWith(
                  (value) => parseAmountFromDB(value?.toString() || "0")
                ),
              remaining:
                sql`SUM(CAST(${transactions.amount} AS DECIMAL))`.mapWith(
                  (value) => parseAmountFromDB(value?.toString() || "0")
                ),
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
              value:
                sql`SUM(ABS(CAST(${transactions.amount} AS DECIMAL)))`.mapWith(
                  (value) => parseAmountFromDB(value?.toString() || "0")
                ),
              count: sql`COUNT(${transactions.id})`,
            })
            .from(transactions)
            .innerJoin(accounts, eq(transactions.accountId, accounts.id))
            .innerJoin(categories, eq(transactions.categoryId, categories.id))
            .where(
              and(
                accountId ? eq(transactions.accountId, accountId) : undefined,
                eq(accounts.userId, auth.userId),
                sql`CAST(${transactions.amount} AS DECIMAL) < 0`,
                gte(transactions.date, startDate),
                lte(transactions.date, endDate)
              )
            )
            .groupBy(categories.name)
            .orderBy(
              sort === "count"
                ? desc(sql`COUNT(${transactions.id})`)
                : desc(sql`SUM(ABS(CAST(${transactions.amount} AS DECIMAL)))`)
            )
            .limit(10),

          // Active days data
          db
            .select({
              date: transactions.date,
              income:
                sql`SUM(CASE WHEN CAST(${transactions.amount} AS DECIMAL) >= 0 THEN CAST(${transactions.amount} AS DECIMAL) ELSE 0 END)`.mapWith(
                  (value) => parseAmountFromDB(value?.toString() || "0")
                ),
              expenses:
                sql`SUM(CASE WHEN CAST(${transactions.amount} AS DECIMAL) < 0 THEN ABS(CAST(${transactions.amount} AS DECIMAL)) ELSE 0 END)`.mapWith(
                  (value) => parseAmountFromDB(value?.toString() || "0")
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
        currentPeriod?.income || 0,
        lastPeriod?.income || 0
      );
      const expensesChange = calculatePercentageChange(
        currentPeriod?.expenses || 0,
        lastPeriod?.expenses || 0
      );
      const remainingChange = calculatePercentageChange(
        currentPeriod?.remaining || 0,
        lastPeriod?.remaining || 0
      );

      // Process categories
      // Sắp xếp theo value giảm dần, nếu bằng nhau thì theo name tăng dần
      const sortedCategories = [...categoryData].sort((a, b) => {
        if (b.value !== a.value) return b.value - a.value;
        return a.name.localeCompare(b.name);
      });
      const maxCategories = limit && limit > 0 ? limit : 5;
      const topCategories = sortedCategories.slice(0, maxCategories);
      const otherCategories = sortedCategories.slice(maxCategories);
      const otherAggregates = otherCategories.reduce(
        (acc, current) => ({
          value: acc.value + current.value,
          count: acc.count + current.count,
        }),
        { value: 0, count: 0 }
      );

      const finalCategories = [...topCategories];
      if (otherCategories.length > 0) {
        finalCategories.push({
          name: "Other",
          value: otherAggregates.value,
          count: otherAggregates.count,
        });
      }

      const days = fillMissingDays(activeDaysData, startDate, endDate);

      return c.json({
        data: {
          remainingAmount: currentPeriod?.remaining || 0,
          remainingChange,
          incomeAmount: currentPeriod?.income || 0,
          incomeChange,
          expensesAmount: currentPeriod?.expenses || 0,
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

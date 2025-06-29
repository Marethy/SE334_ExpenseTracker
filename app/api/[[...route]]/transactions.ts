export const dynamic = 'force-dynamic';
import { z } from "zod";
import { Hono } from "hono";
import { parse, subDays } from "date-fns";
import { createId } from "@paralleldrive/cuid2";
import { getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";

import { db } from "@/db/drizzle";
import {
  transactions,
  insertTransactionSchema,
  categories,
  accounts,
} from "@/db/schema";
import { parseAmountFromDB } from "@/lib/utils";

const app = new Hono()
  .get(
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

      try {
        const data = await db
          .select({
            id: transactions.id,
            category: categories.name,
            categoryId: transactions.categoryId,
            date: transactions.date,
            payee: transactions.payee,
            amount: transactions.amount,
            notes: transactions.notes,
            account: accounts.name,
            accountId: transactions.accountId,
          })
          .from(transactions)
          .innerJoin(accounts, eq(transactions.accountId, accounts.id))
          .leftJoin(categories, eq(transactions.categoryId, categories.id))
          .where(
            and(
              accountId ? eq(transactions.accountId, accountId) : undefined,
              eq(accounts.userId, auth.userId),
              gte(transactions.date, startDate),
              lte(transactions.date, endDate)
            )
          )
          .orderBy(desc(transactions.date));

        // Convert decimal amounts to numbers for frontend
        const processedData = data.map((transaction) => ({
          ...transaction,
          amount: parseAmountFromDB(transaction.amount),
        }));

        return c.json({ data: processedData });
      } catch (error) {
        console.error("Transactions API Error:", error);
        return c.json({ error: "Internal Server Error" }, 500);
      }
    }
  )
  .get(
    "/:id",
    zValidator(
      "param",
      z.object({
        id: z.string().optional(),
      })
    ),
    async (c) => {
      const auth = getAuth(c);
      const { id } = c.req.valid("param");

      if (!id) {
        return c.json({ error: "Bad Request: Missing id" }, 400);
      }

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      try {
        const [data] = await db
          .select({
            id: transactions.id,
            categoryId: transactions.categoryId,
            date: transactions.date,
            payee: transactions.payee,
            amount: transactions.amount,
            notes: transactions.notes,
            accountId: transactions.accountId,
          })
          .from(transactions)
          .innerJoin(accounts, eq(transactions.accountId, accounts.id))
          .where(
            and(eq(transactions.id, id), eq(accounts.userId, auth.userId))
          );

        if (!data) {
          return c.json({ error: "Not found" }, 404);
        }

        // Convert decimal amount to number for frontend
        const processedData = {
          ...data,
          amount: parseAmountFromDB(data.amount),
        };

        return c.json({ data: processedData });
      } catch (error) {
        console.error("Transaction Get API Error:", error);
        return c.json({ error: "Internal Server Error" }, 500);
      }
    }
  )
  .post(
    "/",
    zValidator(
      "json",
      insertTransactionSchema.omit({
        id: true,
      })
    ),
    async (c) => {
      const auth = getAuth(c);
      const values = c.req.valid("json");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      try {
        const [data] = await db
          .insert(transactions)
          .values({
            id: createId(),
            ...values,
          })
          .returning();

        return c.json({ data });
      } catch (error) {
        console.error("Transaction Create API Error:", error);
        return c.json({ error: "Internal Server Error" }, 500);
      }
    }
  )
  .post(
    "/bulk-create",
    zValidator(
      "json",
      z.array(
        insertTransactionSchema.omit({
          id: true,
        })
      )
    ),
    async (c) => {
      const auth = getAuth(c);
      const values = c.req.valid("json");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      try {
        const data = await db
          .insert(transactions)
          .values(
            values.map((value) => ({
              id: createId(),
              ...value,
            }))
          )
          .returning();

        return c.json({ data });
      } catch (error) {
        console.error("Transaction Bulk Create API Error:", error);
        return c.json({ error: "Internal Server Error" }, 500);
      }
    }
  )
  .post(
    "/bulk-delete",
    zValidator(
      "json",
      z.object({
        ids: z.array(z.string()),
      })
    ),
    async (c) => {
      const auth = getAuth(c);
      const values = c.req.valid("json");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      try {
        const transactionsToDelete = db.$with("transactions_to_delete").as(
          db
            .select({ id: transactions.id })
            .from(transactions)
            .innerJoin(accounts, eq(transactions.accountId, accounts.id))
            .where(
              and(
                inArray(transactions.id, values.ids),
                eq(accounts.userId, auth.userId)
              )
            )
        );

        const data = await db
          .with(transactionsToDelete)
          .delete(transactions)
          .where(
            inArray(
              transactions.id,
              sql`(select id from ${transactionsToDelete})`
            )
          )
          .returning({
            id: transactions.id,
          });

        return c.json({ data });
      } catch (error) {
        console.error("Transaction Bulk Delete API Error:", error);
        return c.json({ error: "Internal Server Error" }, 500);
      }
    }
  )
  .patch(
    "/:id",
    zValidator(
      "param",
      z.object({
        id: z.string().optional(),
      })
    ),
    zValidator(
      "json",
      insertTransactionSchema.omit({
        id: true,
      })
    ),
    async (c) => {
      const auth = getAuth(c);
      const { id } = c.req.valid("param");
      const values = c.req.valid("json");

      if (!id) {
        return c.json({ error: "Bad Request: Missing id" }, 400);
      }

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      try {
        const transactionsToUpdate = db.$with("transactions_to_update").as(
          db
            .select({ id: transactions.id })
            .from(transactions)
            .innerJoin(accounts, eq(transactions.accountId, accounts.id))
            .where(
              and(eq(transactions.id, id), eq(accounts.userId, auth.userId))
            )
        );

        const [data] = await db
          .with(transactionsToUpdate)
          .update(transactions)
          .set(values)
          .where(
            inArray(
              transactions.id,
              sql`(select id from ${transactionsToUpdate})`
            )
          )
          .returning();

        if (!data) {
          return c.json({ error: "Not found" }, 404);
        }

        return c.json({ data });
      } catch (error) {
        console.error("Transaction Update API Error:", error);
        return c.json({ error: "Internal Server Error" }, 500);
      }
    }
  )
  .delete(
    "/:id",
    zValidator(
      "param",
      z.object({
        id: z.string().optional(),
      })
    ),
    async (c) => {
      const auth = getAuth(c);
      const { id } = c.req.valid("param");

      if (!id) {
        return c.json({ error: "Bad Request: Missing id" }, 400);
      }

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      try {
        const transactionsToDelete = db.$with("transactions_to_delete").as(
          db
            .select({ id: transactions.id })
            .from(transactions)
            .innerJoin(accounts, eq(transactions.accountId, accounts.id))
            .where(
              and(eq(transactions.id, id), eq(accounts.userId, auth.userId))
            )
        );

        const [data] = await db
          .with(transactionsToDelete)
          .delete(transactions)
          .where(
            inArray(
              transactions.id,
              sql`(select id from ${transactionsToDelete})`
            )
          )
          .returning({ id: transactions.id });

        if (!data) {
          return c.json({ error: "Not found" }, 404);
        }

        return c.json({ data });
      } catch (error) {
        console.error("Transaction Delete API Error:", error);
        return c.json({ error: "Internal Server Error" }, 500);
      }
    }
  );

export default app;

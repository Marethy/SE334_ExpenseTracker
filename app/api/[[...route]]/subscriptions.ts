import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { getAuth } from "@hono/clerk-auth";
import { addYears } from "date-fns";

import { db } from "@/db/drizzle";
import { subscriptions } from "@/db/schema";

const app = new Hono()
  .get("/current", async (c) => {
    const auth = getAuth(c);
    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, auth.userId));

    if (!subscription) {
      const [newSubscription] = await db
        .insert(subscriptions)
        .values({
          id: createId(),
          userId: auth.userId,
          plan: "free",
          status: "active",
          startDate: new Date(),
        })
        .returning();

      return c.json({ data: newSubscription });
    }

    return c.json({ data: subscription });
  })
  .post("/checkout", async (c) => {
    const auth = getAuth(c);

    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const [existing] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, auth.userId));

    if (existing?.plan === "premium" && existing?.status === "active") {
      return c.json({
        data: {
          type: "manage",
          message: "You already have an active premium subscription",
        },
      });
    }

    const checkoutId = createId();
    const mockCheckoutUrl = `${process.env.NEXT_PUBLIC_APP_URL}/checkout/${checkoutId}`;

    return c.json({
      data: {
        type: "checkout",
        url: mockCheckoutUrl,
        checkoutId,
      },
    });
  })
  .post("/upgrade", async (c) => {
    const auth = getAuth(c);

    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const [existing] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, auth.userId));

    if (existing) {
      const [updated] = await db
        .update(subscriptions)
        .set({
          plan: "premium",
          status: "active",
          startDate: new Date(),
          endDate: addYears(new Date(), 1),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.userId, auth.userId))
        .returning();

      return c.json({ data: updated });
    } else {
      const [newSubscription] = await db
        .insert(subscriptions)
        .values({
          id: createId(),
          userId: auth.userId,
          plan: "premium",
          status: "active",
          startDate: new Date(),
          endDate: addYears(new Date(), 1),
        })
        .returning();

      return c.json({ data: newSubscription });
    }
  })
  .post("/cancel", async (c) => {
    const auth = getAuth(c);

    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const [updated] = await db
      .update(subscriptions)
      .set({
        status: "canceled",
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.userId, auth.userId))
      .returning();

    if (!updated) {
      return c.json({ error: "Subscription not found" }, 404);
    }

    return c.json({ data: updated });
  });

export default app;

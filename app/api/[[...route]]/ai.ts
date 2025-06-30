export const dynamic = "force-dynamic";
import { Hono } from "hono";
import { getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

if (!AI_SERVICE_URL) {
  console.error("AI_SERVICE_URL environment variable is not set");
}

const app = new Hono()
  .post(
    "/analyze",
    zValidator(
      "json",
      z.object({
        question: z.string().min(1, "Question is required"),
        stream: z.boolean().default(true),
      })
    ),
    async (c) => {
      const auth = getAuth(c);
      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      if (!AI_SERVICE_URL) {
        return c.json({ error: "AI Service not configured" }, 503);
      }

      const { question, stream } = c.req.valid("json");

      try {
        const response = await fetch(`${AI_SERVICE_URL}/analyze/optimized`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: auth.userId,
            question,
            stream,
            use_cache: true,
          }),
        });

        if (!response.ok) {
          throw new Error(`AI Service error: ${response.status}`);
        }

        if (stream) {
          return new Response(response.body, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          });
        } else {
          const data = await response.json();
          return c.json(data);
        }
      } catch (error) {
        console.error("AI API Error:", error);
        return c.json(
          {
            error: "Failed to analyze question",
            details: error instanceof Error ? error.message : "Unknown error",
          },
          500
        );
      }
    }
  )
  .get("/health", async (c) => {
    if (!AI_SERVICE_URL) {
      return c.json({ error: "AI Service not configured" }, 503);
    }

    try {
      const response = await fetch(`${AI_SERVICE_URL}/health`);
      const data = await response.json();
      return c.json(data);
    } catch (error) {
      return c.json(
        {
          error: "AI Service unavailable",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        503
      );
    }
  });

export default app;

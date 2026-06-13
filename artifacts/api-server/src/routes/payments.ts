import { Router } from "express";
import Stripe from "stripe";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreatePaymentIntentBody, ConfirmPaymentBody } from "@workspace/api-zod";

const router = Router();

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key);
}

router.post("/create-intent", async (req, res) => {
  const parsed = CreatePaymentIntentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }

  try {
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, parsed.data.orderId));

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const stripe = getStripe();
    const amountInCents = Math.round(Number(order.totalAmount) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      metadata: { orderId: String(order.id) },
    });

    // Store the payment intent ID on the order
    await db
      .update(ordersTable)
      .set({ paymentIntentId: paymentIntent.id })
      .where(eq(ordersTable.id, order.id));

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: Number(order.totalAmount),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create payment intent");
    res.status(500).json({ error: "Failed to create payment intent" });
  }
});

router.post("/confirm", async (req, res) => {
  const parsed = ConfirmPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  try {
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(parsed.data.paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      res.status(400).json({ error: "Payment has not succeeded" });
      return;
    }

    const [order] = await db
      .update(ordersTable)
      .set({ status: "paid" })
      .where(eq(ordersTable.id, parsed.data.orderId))
      .returning();

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const items = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, order.id));

    res.json({
      ...order,
      totalAmount: Number(order.totalAmount),
      items: items.map((i) => ({
        ...i,
        unitPrice: Number(i.unitPrice),
        subtotal: Number(i.subtotal),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to confirm payment");
    res.status(500).json({ error: "Failed to confirm payment" });
  }
});

export default router;

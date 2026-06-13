import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
const router = Router();

const VALID_STATUSES = ["pending", "paid", "preparing", "ready", "completed", "cancelled"] as const;
type OrderStatus = (typeof VALID_STATUSES)[number];

router.get("/orders", async (req, res) => {
  try {
    const orders = await db
      .select()
      .from(ordersTable)
      .orderBy(desc(ordersTable.createdAt));

    const items = await db.select().from(orderItemsTable);
    const itemsByOrderId = new Map<number, typeof items>();
    for (const item of items) {
      if (!itemsByOrderId.has(item.orderId)) itemsByOrderId.set(item.orderId, []);
      itemsByOrderId.get(item.orderId)!.push(item);
    }

    res.json(
      orders.map((o) => ({
        ...o,
        totalAmount: Number(o.totalAmount),
        items: (itemsByOrderId.get(o.id) ?? []).map((i) => ({
          ...i,
          unitPrice: Number(i.unitPrice),
          subtotal: Number(i.subtotal),
        })),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list admin orders");
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

router.patch("/orders/:id/status", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid order id" });
    return;
  }
  const { status } = req.body;
  if (!status || !VALID_STATUSES.includes(status as OrderStatus)) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }
  try {
    const [order] = await db
      .update(ordersTable)
      .set({ status: status as OrderStatus })
      .where(eq(ordersTable.id, id))
      .returning();

    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json({ ...order, totalAmount: Number(order.totalAmount) });
  } catch (err) {
    req.log.error({ err }, "Failed to update order status");
    res.status(500).json({ error: "Failed to update status" });
  }
});

export default router;

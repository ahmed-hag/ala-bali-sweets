import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateOrderBody, GetOrderParams } from "@workspace/api-zod";

const router = Router();

function formatOrder(order: typeof ordersTable.$inferSelect, items: typeof orderItemsTable.$inferSelect[]) {
  return {
    ...order,
    totalAmount: Number(order.totalAmount),
    items: items.map((i) => ({
      ...i,
      unitPrice: Number(i.unitPrice),
      subtotal: Number(i.subtotal),
    })),
  };
}

router.post("/", async (req, res) => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid order data", details: parsed.error.issues });
    return;
  }
  const { customerName, customerEmail, customerPhone, deliveryType, deliveryAddress, items, notes } = parsed.data;

  if (deliveryType === "delivery" && !deliveryAddress) {
    res.status(400).json({ error: "Delivery address is required for in-town delivery" });
    return;
  }

  try {
    // Fetch products to calculate prices
    const productIds = items.map((i) => i.productId);
    const products = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, productIds[0]));

    // Fetch all products
    const allProducts = await db.select().from(productsTable);
    const productMap = new Map(allProducts.map((p) => [p.id, p]));

    // Validate all items and compute total
    let totalAmount = 0;
    const orderItemsData: {
      productId: number;
      productName: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }[] = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        res.status(400).json({ error: `Product ${item.productId} not found` });
        return;
      }
      if (!product.available) {
        res.status(400).json({ error: `Product "${product.name}" is not available` });
        return;
      }
      const unitPrice = Number(product.price);
      const subtotal = unitPrice * item.quantity;
      totalAmount += subtotal;
      orderItemsData.push({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        unitPrice,
        subtotal,
      });
    }

    // Delivery fee
    if (deliveryType === "delivery") {
      totalAmount += 3.0; // $3 delivery fee
    }

    const [order] = await db
      .insert(ordersTable)
      .values({
        customerName,
        customerEmail,
        customerPhone: customerPhone ?? null,
        deliveryType,
        deliveryAddress: deliveryAddress ?? null,
        totalAmount: totalAmount.toFixed(2),
        status: "pending",
        notes: notes ?? null,
      })
      .returning();

    await db.insert(orderItemsTable).values(
      orderItemsData.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        subtotal: item.subtotal.toFixed(2),
      }))
    );

    const orderItems = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, order.id));

    res.status(201).json(formatOrder(order, orderItems));
  } catch (err) {
    req.log.error({ err }, "Failed to create order");
    res.status(500).json({ error: "Failed to create order" });
  }
});

router.get("/:id", async (req, res) => {
  const parsed = GetOrderParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid order id" });
    return;
  }
  try {
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.id, parsed.data.id));
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    const items = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, order.id));

    res.json(formatOrder(order, items));
  } catch (err) {
    req.log.error({ err }, "Failed to get order");
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

export default router;

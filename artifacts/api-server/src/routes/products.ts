import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetProductParams } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const products = await db.select().from(productsTable).orderBy(productsTable.category);
    res.json(
      products.map((p) => ({
        ...p,
        price: Number(p.price),
      }))
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list products");
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

router.get("/:id", async (req, res) => {
  const parsed = GetProductParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }
  try {
    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, parsed.data.id));
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json({ ...product, price: Number(product.price) });
  } catch (err) {
    req.log.error({ err }, "Failed to get product");
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

export default router;
